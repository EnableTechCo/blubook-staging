export function BrandMark({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  const size = compact ? 22 : 28;

  return (
    <span
      className={`inline-flex items-center gap-2 ${inverse ? "text-paper-light" : "text-ink"}`}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
        <rect
          x="1"
          y="1"
          width="20"
          height="20"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M6 6h6a3 3 0 0 1 0 6H6zM6 12h7a3 3 0 0 1 0 6H6z"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
      <span className={`font-heading leading-none tracking-tight ${compact ? "text-2xl" : "text-[1.65rem]"}`}>
        BluBook
      </span>
    </span>
  );
}
