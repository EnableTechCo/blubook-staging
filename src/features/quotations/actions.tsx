"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { fileIntoFolder } from "@/features/onboarding/intakeUploads";
import { getLetterheadState } from "@/features/letterhead/queries";
import { renderPdf } from "@/features/pdf/render";
import { QuotationDocument } from "@/features/quotations/QuotationDocument";
import { lineTotals, quotationTotals } from "@/features/quotations/totals";

export type QuotationState =
  | { error: string }
  | { ok: true; reference: string; quotationId: string }
  | undefined;

const lineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive("A quantity has to be more than nothing.").max(999999),
});

const quotationSchema = z.object({
  recipientName: z.string().trim().min(1, "Who is this quotation for?").max(200),
  recipientCompany: z.string().trim().max(200).optional(),
  recipientEmail: z.string().trim().email("Enter a valid email.").max(200).optional().or(z.literal("")),
  recipientAddress: z.string().trim().max(600).optional(),
  notes: z.string().trim().max(2000).optional(),
  expiresAt: z.string().trim().max(20).optional(),
  lines: z.array(lineSchema).min(1, "Add at least one product."),
});

const iso = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Raise a quotation, print it onto the letterhead and file the copy.
 *
 * The lines are copied from the product list rather than pointed at it. A
 * quotation is a statement about a price on a date; if the list is repriced
 * next week, what was quoted last week has to keep saying what it said.
 */
export async function createQuotation(
  _previous: QuotationState,
  formData: FormData,
): Promise<QuotationState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.user_type !== "client") return { error: "Only a client can raise a quotation." };

  let lines: unknown = [];
  try {
    lines = JSON.parse((formData.get("lines") as string) || "[]");
  } catch {
    return { error: "The selected products could not be read." };
  }

  const parsed = quotationSchema.safeParse({
    recipientName: formData.get("recipientName"),
    recipientCompany: formData.get("recipientCompany") || undefined,
    recipientEmail: formData.get("recipientEmail") || "",
    recipientAddress: formData.get("recipientAddress") || undefined,
    notes: formData.get("notes") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    lines,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the quotation." };

  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("id").maybeSingle();
  if (!client) return { error: "No client account is linked to your profile." };

  // Priced from the client's own list, read now. A product the client cannot
  // see is a product it cannot quote.
  const { data: products } = await supabase
    .from("client_products")
    .select("id,product_code,description,unit,unit_price,vat_rate")
    .in("id", parsed.data.lines.map((line) => line.productId))
    .eq("active", true);

  const byId = new Map((products ?? []).map((product) => [product.id, product]));
  const missing = parsed.data.lines.filter((line) => !byId.has(line.productId));
  if (missing.length > 0) {
    return { error: "A selected product is no longer on your list. Refresh and try again." };
  }

  const items = parsed.data.lines.map((line, index) => {
    const product = byId.get(line.productId)!;
    const totals = lineTotals({
      quantity: line.quantity,
      unit_price: Number(product.unit_price),
      vat_rate: Number(product.vat_rate),
    });
    return {
      product_code: product.product_code,
      description: product.description,
      unit: product.unit,
      quantity: line.quantity,
      unit_price: Number(product.unit_price),
      vat_rate: Number(product.vat_rate),
      line_total: totals.lineTotal,
      position: index,
    };
  });

  const totals = quotationTotals(items);

  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .insert({
      client_id: client.id,
      recipient_name: parsed.data.recipientName,
      recipient_company: parsed.data.recipientCompany ?? null,
      recipient_email: parsed.data.recipientEmail || null,
      recipient_address: parsed.data.recipientAddress ?? null,
      notes: parsed.data.notes ?? null,
      expires_at:
        parsed.data.expiresAt || iso(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      subtotal: totals.subtotal,
      vat_total: totals.vatTotal,
      total: totals.total,
      reference: "",
    })
    .select("id,reference,issue_date,expires_at")
    .single();

  if (quotationError || !quotation) {
    return { error: quotationError?.message ?? "Could not raise the quotation." };
  }

  const { error: itemsError } = await supabase
    .from("quotation_items")
    .insert(items.map((item) => ({ ...item, quotation_id: quotation.id })));
  if (itemsError) {
    // Without its lines the quotation is a total with nothing behind it, so it
    // goes rather than being left half-written.
    await supabase.from("quotations").delete().eq("id", quotation.id);
    return { error: itemsError.message };
  }

  // The letterhead is read under the client's own session, which is the only
  // session allowed to see the banking details printed on it.
  const { data: letterhead } = await getLetterheadState();
  if (!letterhead) return { error: "Your letterhead could not be built." };

  const pdf = await renderPdf(
    <QuotationDocument
      letterhead={letterhead}
      quotation={{
        reference: quotation.reference,
        issueDate: quotation.issue_date,
        expiresAt: quotation.expires_at,
        recipientName: parsed.data.recipientName,
        recipientCompany: parsed.data.recipientCompany ?? null,
        recipientEmail: parsed.data.recipientEmail || null,
        recipientAddress: parsed.data.recipientAddress ?? null,
        notes: parsed.data.notes ?? null,
        lines: items,
        subtotal: totals.subtotal,
        vatTotal: totals.vatTotal,
        total: totals.total,
      }}
    />,
  );

  // Storage and the documents row need the service role; the quotation itself
  // was written as the client.
  const admin = createAdminClient();
  const path = `${client.id}/${quotation.id}-${quotation.reference}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("documents")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });

  if (!uploadError) {
    const { data: document } = await admin
      .from("documents")
      .insert({
        client_id: client.id,
        uploaded_by: profile.id,
        category: "other",
        title: `Quotation ${quotation.reference} — ${parsed.data.recipientCompany ?? parsed.data.recipientName}`,
        storage_path: path,
        mime_type: "application/pdf",
        size_bytes: pdf.length,
      })
      .select("id")
      .single();

    if (document) {
      await supabase.from("quotations").update({ document_id: document.id }).eq("id", quotation.id);
      await fileIntoFolder(admin, {
        documentId: document.id,
        ownerProfileId: profile.id,
        slug: "quotations",
      });
    }
  }

  revalidatePath("/dashboard/transact/quotation");
  revalidatePath("/dashboard/documents");
  return { ok: true, reference: quotation.reference, quotationId: quotation.id };
}
