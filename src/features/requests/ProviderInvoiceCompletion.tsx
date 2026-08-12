"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { prepareDirectDocumentUpload } from "@/features/documents/directUploadActions";
import { uploadDocumentDirectly } from "@/features/documents/directUpload";
import { documentPolicyError } from "@/features/documents/uploadPolicy";
import { completeSalesOrderWithInvoice } from "@/features/requests/providerInvoiceActions";

export function ProviderInvoiceCompletion({ requestId }: { requestId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function submit(formData: FormData) {
    const file = formData.get("invoice");
    const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
    if (!(file instanceof File) || file.size === 0) return setError("Attach the invoice document.");
    const policyError = documentPolicyError(file);
    if (policyError) return setError(policyError);
    setPending(true);
    setError(null);
    try {
      const prepared = await prepareDirectDocumentUpload({ requestId, name: file.name, size: file.size, type: file.type });
      if (!prepared.ok) throw new Error(prepared.error);
      const uploaded = await uploadDocumentDirectly({ file, prepared: prepared.upload, onProgress: setProgress });
      const result = await completeSalesOrderWithInvoice({ requestId, invoiceNumber, document: uploaded });
      if (!result.ok) throw new Error(result.error);
      formRef.current?.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not return the invoice.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={(data) => void submit(data)} className="mt-6 border border-cobalt bg-cobalt-wash p-5">
      <p className="font-heading text-2xl">Send invoice and complete</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        The invoice will be delivered to the client, the sales order will close, and its opportunity will move to Booked.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="invoiceNumber" className={labelStyles}>Invoice number</label>
          <input id="invoiceNumber" name="invoiceNumber" required maxLength={120} className={fieldStyles} />
        </div>
        <div>
          <label htmlFor="invoice" className={labelStyles}>Invoice document</label>
          <input id="invoice" name="invoice" type="file" required accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" className={fieldStyles} />
        </div>
      </div>
      {pending ? <p className="mt-3 text-xs text-ink/60">Uploading invoice… {progress}%</p> : null}
      {error ? <p role="alert" className="mt-3 border-l-4 border-clay px-3 text-sm text-clay">{error}</p> : null}
      <div className="mt-4"><Button type="submit" disabled={pending}>{pending ? "Completing…" : "Send invoice and complete"}</Button></div>
    </form>
  );
}
