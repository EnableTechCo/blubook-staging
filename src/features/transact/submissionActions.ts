"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { KIND_LABEL, SERVICE_SLUGS } from "@/features/transact/kinds";
import type { UploadedDocumentInput } from "@/features/documents/uploadPolicy";
import {
  persistRequestDocuments,
  removeUploadedDocuments,
  verifyUploadedDocuments,
} from "@/features/documents/requestAttachments";
import {
  submissionSchema,
  summary,
  type SubmitTransactionResult,
} from "@/features/transact/submissionSchema";
import type { Json } from "@/types/database";
import { ROUTES } from "@/lib/routes";

export async function submitDocumentTransaction(input: unknown): Promise<SubmitTransactionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not authenticated." };
  if (profile.user_type !== "client") {
    return { ok: false, error: "Only clients can submit transactions." };
  }

  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }
  const submission = parsed.data;
  if (
    submission.kind === "sales_order" &&
    Boolean(submission.opportunityId) === Boolean(submission.newOpportunity)
  ) {
    await removeUploadedDocuments(submission.files);
    return { ok: false, error: "Select one existing opportunity or create one new opportunity." };
  }

  const supabase = await createClient();
  const [{ data: client }, { data: service }] = await Promise.all([
    supabase.from("clients").select("id").maybeSingle(),
    supabase
      .from("services")
      .select("id")
      .eq("slug", SERVICE_SLUGS[submission.kind])
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!client) {
    await removeUploadedDocuments(submission.files);
    return { ok: false, error: "No client account is linked to your profile." };
  }
  if (!service) {
    await removeUploadedDocuments(submission.files);
    return {
      ok: false,
      error: `${KIND_LABEL[submission.kind]} submission is not configured yet.`,
    };
  }

  let orderCategoryId: string | null = null;
  if (submission.kind === "sales_order" || submission.kind === "purchase_order") {
    const { data: category } = await supabase
      .from("document_categories")
      .select("id")
      .eq("slug", "purchase-orders")
      .eq("active", true)
      .maybeSingle();
    orderCategoryId = category?.id ?? null;
  }

  // A completed browser retry carries the same first object locator. Reuse the
  // linked request instead of creating another SR. A strict concurrency lock
  // would require a database constraint, which this no-migration release avoids.
  const admin = createAdminClient();
  const { data: existingDocument } = await admin
    .from("documents")
    .select("id")
    .eq("client_id", client.id)
    .eq("storage_path", submission.files[0].locator)
    .maybeSingle();
  if (existingDocument) {
    const { data: existingLink } = await admin
      .from("request_documents")
      .select("request_id,service_requests(reference)")
      .eq("document_id", existingDocument.id)
      .maybeSingle<{
        request_id: string;
        service_requests: { reference: string } | null;
      }>();
    if (existingLink?.service_requests) {
      return {
        ok: true,
        reference: existingLink.service_requests.reference,
        requestId: existingLink.request_id,
      };
    }
  }

  const content = summary(submission);
  if (submission.kind === "sales_order") {
    const verification = await verifyUploadedDocuments({ clientId: client.id, files: submission.files });
    if (verification.error) return { ok: false, error: verification.error };

    const { data, error } = await supabase.rpc("submit_linked_sales_order", {
      // p_category_id defaults to null in SQL, so omitting it is the same as
      // passing null. p_opportunity_id has no default but is nullable: null
      // is exactly what a sales order raised against a new opportunity sends.
      // The generated types cannot say either, hence the cast.
      p_category_id: orderCategoryId ?? undefined,
      p_description: content.description,
      p_documents: verification.documents.map((document) => ({ ...document })) as Json,
      p_new_opportunity: submission.newOpportunity ?? null,
      p_opportunity_id: (submission.opportunityId ?? null) as string,
      p_service_id: service.id,
      p_title: content.title,
    });
    const created = data?.[0];
    if (error || !created) {
      await removeUploadedDocuments(submission.files);
      return { ok: false, error: error?.message ?? "Could not create the sales-order request." };
    }
    const { error: routeError } = await admin.rpc("route_request", { p_request_id: created.request_id });
    if (routeError) {
      await admin.from("service_requests").update({ status: "awaiting_assignment" }).eq("id", created.request_id).eq("status", "new");
    }
    revalidatePath(ROUTES.dashboard);
    revalidatePath(ROUTES.documents);
    revalidatePath(ROUTES.salesPipeline);
    revalidatePath(ROUTES.transact);
    revalidatePath(ROUTES.reportsRequests);
    return { ok: true, reference: created.request_reference, requestId: created.request_id };
  }

  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .insert({
      client_id: client.id,
      description: content.description,
      origin: "client",
      reference: "",
      request_type: submission.kind,
      service_id: service.id,
      title: content.title,
    })
    .select("id,reference")
    .single();

  if (requestError || !request) {
    await removeUploadedDocuments(submission.files);
    return { ok: false, error: requestError?.message ?? "Could not create the request." };
  }

  const persisted = await persistRequestDocuments({
    categoryId: orderCategoryId,
    clientId: client.id,
    files: submission.files as UploadedDocumentInput[],
    profileId: profile.id,
    requestId: request.id,
  });
  if (persisted.error) {
    await createAdminClient().from("service_requests").delete().eq("id", request.id);
    return { ok: false, error: persisted.error };
  }

  const { error: routeError } = await admin.rpc("route_request", {
    p_request_id: request.id,
  });
  if (routeError) {
    await admin
      .from("service_requests")
      .update({ status: "awaiting_assignment" })
      .eq("id", request.id)
      .eq("status", "new");
  }

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.documents);
  revalidatePath(ROUTES.transact);
  revalidatePath(ROUTES.reportsRequests);
  return { ok: true, reference: request.reference, requestId: request.id };
}
