import sharp from "sharp";
import { artworkUrl } from "@/features/dashboard/ClientArtwork";

const RASTER_ARTWORK_EXTENSION = /\.(?:png|jpe?g)$/i;

/**
 * react-pdf embeds PNG and JPEG directly, but a client may legitimately use
 * SVG or WebP artwork. Convert those files to PNG server-side so a logo can
 * never prevent a quote or letterhead from being generated.
 */
export async function pdfArtworkSource(path: string | null): Promise<string | Buffer | null> {
  if (!path) return null;

  const sourceUrl = artworkUrl(path);
  if (RASTER_ARTWORK_EXTENSION.test(path)) return sourceUrl;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) return null;

    return await sharp(Buffer.from(await response.arrayBuffer()), { limitInputPixels: 20_000_000 })
      .png()
      .toBuffer();
  } catch {
    // The business name remains in the header, so a malformed logo should not
    // make an otherwise valid client document unavailable.
    return null;
  }
}