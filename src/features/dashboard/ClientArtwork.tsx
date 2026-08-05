const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// The artwork bucket is public, so the stored path resolves to a URL the
// browser can load directly — no signed URL per render.
export function artworkUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/artwork/${path}`;
}

function initials(businessName: string): string {
  return businessName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

// The client's profile picture. Falls back to their initials so the header
// keeps its shape for an account that has not supplied artwork.
export function ClientArtwork({
  businessName,
  artworkPath,
  prominent = false,
}: {
  businessName: string;
  artworkPath: string | null;
  prominent?: boolean;
}) {
  const shared = prominent
    ? "flex h-28 w-full items-center justify-center overflow-hidden bg-paper px-5 py-4"
    : "flex size-14 shrink-0 items-center justify-center overflow-hidden border border-ink bg-paper";

  if (!artworkPath) {
    return (
      <div className={shared} aria-hidden="true">
        <span
          className={`font-heading leading-none text-ink/45 ${
            prominent ? "text-5xl" : "text-xl"
          }`}
        >
          {initials(businessName) || "—"}
        </span>
      </div>
    );
  }

  return (
    <div className={shared}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage
          is not configured as a Next image loader domain. */}
      <img
        src={artworkUrl(artworkPath)}
        alt={`${businessName} artwork`}
        className="size-full object-contain"
      />
    </div>
  );
}
