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
import { sastFiscalPeriod } from "@/lib/time";

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

  // A quotation may raise a pipeline opportunity, and usually should not. A
  // walk-in quoted for two items does not belong in a forecast.
  createOpportunity: z.boolean().default(false),
  opportunityName: z.string().trim().max(240).optional(),
  opportunitySource: z.string().trim().max(80).optional(),
  forecastCategory: z.string().trim().max(80).optional(),
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
    createOpportunity: formData.get("createOpportunity") === "on",
    opportunityName: formData.get("opportunityName") || undefined,
    opportunitySource: formData.get("opportunitySource") || undefined,
    forecastCategory: formData.get("forecastCategory") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the quotation." };
  if (parsed.data.createOpportunity && !parsed.data.opportunitySource) {
    return { error: "Choose where the opportunity came from." };
  }

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

  // The opportunity first, so a quotation is never left pointing at one that
  // failed to be created. If this fails the quotation is not raised at all,
  // which is the honest outcome: the client asked for both.
  let opportunityId: string | null = null;
  if (parsed.data.createOpportunity) {
    const period = sastFiscalPeriod(new Date());

    // The pipeline carries revenue, and VAT is not revenue — it is collected on
    // somebody else's behalf. The forecast figure is therefore the subtotal,
    // not the total the customer pays.
    const { data: opportunity, error: opportunityError } = await supabase
      .from("sales_opportunities")
      .insert({
        client_id: client.id,
        deal_reference: "",
        opportunity_name:
          parsed.data.opportunityName?.trim() ||
          `${parsed.data.recipientCompany ?? parsed.data.recipientName} quotation`,
        opportunity_source: parsed.data.opportunitySource!,
        forecast_category: parsed.data.forecastCategory || "open",
        revenue: totals.subtotal,
        // Phased into the quarter it was quoted in, so it lands on the chart
        // where the client would look for it rather than unphased.
        fiscal_year: period.year,
        fiscal_quarter: period.quarter,
        fiscal_week: period.quarterWeek,
      })
      .select("id")
      .single();

    if (opportunityError || !opportunity) {
      return { error: opportunityError?.message ?? "Could not create the opportunity." };
    }
    opportunityId = opportunity.id;
  }

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
      opportunity_id: opportunityId,
      reference: "",
    })
    .select("id,reference,issue_date,expires_at")
    .single();

  if (quotationError || !quotation) {
    if (opportunityId) await supabase.from("sales_opportunities").delete().eq("id", opportunityId);
    return { error: quotationError?.message ?? "Could not raise the quotation." };
  }

  const { error: itemsError } = await supabase
    .from("quotation_items")
    .insert(items.map((item) => ({ ...item, quotation_id: quotation.id })));
  if (itemsError) {
    // Without its lines the quotation is a total with nothing behind it, so it
    // goes rather than being left half-written.
    await supabase.from("quotations").delete().eq("id", quotation.id);
    if (opportunityId) await supabase.from("sales_opportunities").delete().eq("id", opportunityId);
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
        category: "quotation",
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
  if (opportunityId) revalidatePath("/dashboard/sales/pipeline");
  return { ok: true, reference: quotation.reference, quotationId: quotation.id };
}
