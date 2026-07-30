"use client";

import { Upload } from "tus-js-client";
import type {
  PreparedDocumentUpload,
  UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";

const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

export function uploadDocumentDirectly({
  file,
  prepared,
  onProgress,
}: {
  file: File;
  prepared: PreparedDocumentUpload;
  onProgress?: (percentage: number) => void;
}): Promise<UploadedDocumentInput> {
  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: prepared.endpoint,
      retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
      headers: {
        "x-signature": prepared.token,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: prepared.bucket,
        objectName: prepared.objectPath,
        contentType: file.type,
        cacheControl: "3600",
      },
      onError(error) {
        reject(new Error(error.message || "Upload failed."));
      },
      onProgress(bytesUploaded, bytesTotal) {
        onProgress?.(bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0);
      },
      onSuccess() {
        resolve({
          locator: prepared.locator,
          title: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
      },
    });

    void upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      })
      .catch(reject);
  });
}
