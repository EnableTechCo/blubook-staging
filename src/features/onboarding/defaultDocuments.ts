import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { fileIntoFolder } from "@/features/onboarding/intakeUploads";

type Admin = SupabaseClient<Database>;

export const DELIVERY_SERVICE_SLUG = "blubook-document-delivery";
export const LIBRARY_PREFIX = "library";

export interface DeliveredDocument {
  requestId: string;
  reference: string;
  documentId: string;
  storagePath: string;
  name: string;
}

// The work groups a package touches, resolved through its services. Derived
// rather than stored, so the answer stays correct if a service later moves
// between groups. Services with no group contribute nothing.
export async function workGroupsForServices(
  admin: Admin,
  serviceIds: string[],
): Promise<string[]> {
  if (serviceIds.length === 0) return [];

  const { data, error } = await admin
    .from("services")
    .select("group_id")
    .in("id", [...new Set(serviceIds)]);
  if (error) throw new Error(error.message);

  return [...new Set((data ?? []).map((row) => row.group_id).filter((id): id is string => !!id))];
}

// Sends the default documents a newly onboarded client should receive. Each
// becomes its own request so the client acknowledges them individually, and
// each stays open until they do.
//
// Two sources combine: BluBook's own documents, which everyone gets, and each
// work group's documents, which only reach clients whose package includes a
// service in that group.
//
// The template object is copied rather than shared: the client's copy has to
// survive the template being replaced or retired, and storage paths are scoped
// per client so one client can never read another's object.
export async function deliverDefaultDocuments(
  admin: Admin,
  options: {
    clientId: string;
    clientProfileId: string;
    staffProfileId: string;
    // Services on the package the client was onboarded with.
    serviceIds: string[];
  },
): Promise<DeliveredDocument[]> {
  const groupIds = await workGroupsForServices(admin, options.serviceIds);

  // PostgREST cannot express "null OR in list" in one filter, so the two
  // sources are fetched separately and merged.
  const columns = "id,name,description,storage_path,mime_type,size_bytes,target_folder_slug,sort_order";
  const [blubook, groupOwned] = await Promise.all([
    admin.from("default_documents").select(columns).eq("active", true).is("work_group_id", null),
    groupIds.length > 0
      ? admin.from("default_documents").select(columns).eq("active", true).in("work_group_id", groupIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (blubook.error) throw new Error(blubook.error.message);
  if (groupOwned.error) throw new Error(groupOwned.error.message);

  const templates = [...(blubook.data ?? []), ...(groupOwned.data ?? [])].sort(
    (left, right) => left.sort_order - right.sort_order || left.name.localeCompare(right.name),
  );
  if (templates.length === 0) return [];

  const { data: service, error: serviceErr } = await admin
    .from("services")
    .select("id")
    .eq("slug", DELIVERY_SERVICE_SLUG)
    .maybeSingle();
  if (serviceErr || !service) {
    throw new Error("The document delivery service is missing from the catalogue.");
  }

  const delivered: DeliveredDocument[] = [];

  for (const template of templates) {
    const suffix = template.storage_path.split("/").pop() ?? "document";
    const copyPath = `${options.clientId}/${crypto.randomUUID()}-${suffix}`;

    const { error: copyErr } = await admin.storage
      .from("documents")
      .copy(template.storage_path, copyPath);
    if (copyErr) throw new Error(`Could not copy "${template.name}": ${copyErr.message}`);

    const { data: document, error: documentErr } = await admin
      .from("documents")
      .insert({
        client_id: options.clientId,
        uploaded_by: options.staffProfileId,
        category: "generated",
        title: template.name,
        storage_path: copyPath,
        mime_type: template.mime_type,
        size_bytes: template.size_bytes,
      })
      .select("id")
      .single();
    if (documentErr || !document) {
      await admin.storage.from("documents").remove([copyPath]);
      throw new Error(documentErr?.message ?? `Could not save "${template.name}".`);
    }

    // Filed into the client's own tree, so the archive is organised on day one.
    if (template.target_folder_slug) {
      await fileIntoFolder(admin, {
        documentId: document.id,
        ownerProfileId: options.clientProfileId,
        slug: template.target_folder_slug,
      });
    }

    // Left at 'new': delivered, waiting on the client. It is not 'open', which
    // means a partner has been offered the work.
    const { data: request, error: requestErr } = await admin
      .from("service_requests")
      .insert({
        reference: "",
        origin: "system",
        request_type: "document_delivery",
        client_id: options.clientId,
        service_id: service.id,
        title: template.name,
        description:
          template.description ??
          "Issued by BluBook when your account went live. Acknowledge receipt to close this request.",
      })
      .select("id,reference")
      .single();
    if (requestErr || !request) {
      throw new Error(requestErr?.message ?? `Could not raise a request for "${template.name}".`);
    }

    const { error: linkErr } = await admin
      .from("request_documents")
      .insert({ request_id: request.id, document_id: document.id });
    if (linkErr) throw new Error(linkErr.message);

    delivered.push({
      requestId: request.id,
      reference: request.reference,
      documentId: document.id,
      storagePath: copyPath,
      name: template.name,
    });
  }

  return delivered;
}
