export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_SUBMISSION = 5;

export const ALLOWED_DOCUMENT_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
} as const;

export type AllowedDocumentMimeType = keyof typeof ALLOWED_DOCUMENT_TYPES;

export interface UploadedDocumentInput {
  locator: string;
  title: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PreparedDocumentUpload {
  bucket: "documents";
  endpoint: string;
  locator: string;
  objectPath: string;
  token: string;
}

export function documentTypeIsAllowed(name: string, mimeType: string): boolean {
  const extensions = ALLOWED_DOCUMENT_TYPES[mimeType as AllowedDocumentMimeType];
  if (!extensions) return false;
  const lowerName = name.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(extension));
}

export function documentPolicyError(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (file.size <= 0) return "Choose a non-empty file.";
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return "Each file must be 50 MB or smaller.";
  if (!documentTypeIsAllowed(file.name, file.type)) {
    return "Use PDF, DOCX, XLSX, CSV, PNG, JPG or JPEG files.";
  }
  return null;
}
