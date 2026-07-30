"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { attachUploadedDocuments } from "@/features/documents/attachmentActions";
import { uploadDocumentDirectly } from "@/features/documents/directUpload";
import { prepareDirectDocumentUpload } from "@/features/documents/directUploadActions";
import {
  documentPolicyError,
  MAX_DOCUMENTS_PER_SUBMISSION,
  type UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";

const ACCEPTED_FILES = ".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg";

export function RequestAttachmentUploader({ requestId }: { requestId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  async function submit(formData: FormData) {
    setError(null);
    setComplete(false);
    const files = formData
      .getAll("documents")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0 || files.length > MAX_DOCUMENTS_PER_SUBMISSION) {
      setError(`Attach between 1 and ${MAX_DOCUMENTS_PER_SUBMISSION} files.`);
      return;
    }
    for (const file of files) {
      const policyError = documentPolicyError(file);
      if (policyError) {
        setError(`${file.name}: ${policyError}`);
        return;
      }
    }

    setPending(true);
    setProgress(Object.fromEntries(files.map((file) => [file.name, 0])));
    try {
      const uploaded: UploadedDocumentInput[] = [];
      for (const file of files) {
        const prepared = await prepareDirectDocumentUpload({
          name: file.name,
          requestId,
          size: file.size,
          type: file.type,
        });
        if (!prepared.ok) throw new Error(prepared.error);
        uploaded.push(
          await uploadDocumentDirectly({
            file,
            prepared: prepared.upload,
            onProgress(percentage) {
              setProgress((current) => ({ ...current, [file.name]: percentage }));
            },
          }),
        );
      }

      const result = await attachUploadedDocuments({ files: uploaded, requestId });
      if (!result.ok) throw new Error(result.error);
      setComplete(true);
      window.location.reload();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not attach the files.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={(formData) => void submit(formData)} className="space-y-3" aria-busy={pending}>
      <label htmlFor="request-documents" className="block text-xs font-semibold text-ink">
        Add request files
      </label>
      <input
        id="request-documents"
        name="documents"
        type="file"
        accept={ACCEPTED_FILES}
        multiple
        required
        disabled={pending}
        className="w-full border border-ink/45 bg-cream p-3 text-xs text-ink file:mr-4 file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-paper-light"
      />
      <p className="text-xs leading-5 text-ink/55">
        Up to five supported files, 50 MB each. Files remain private to this request.
      </p>

      {Object.keys(progress).length > 0 ? (
        <ul className="space-y-1 text-xs text-ink/60">
          {Object.entries(progress).map(([name, percentage]) => (
            <li key={name} className="flex justify-between gap-3">
              <span className="truncate">{name}</span>
              <span>{percentage}%</span>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="border-l-[3px] border-clay px-3 text-xs text-ink">{error}</p> : null}
      {complete ? <p className="border-l-[3px] border-teal px-3 text-xs text-ink">Files added.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Add files"}
      </Button>
    </form>
  );
}
