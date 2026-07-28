export function BrandMark({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${inverse ? "text-paper-light" : "text-ink"}`}
      aria-hidden="true"
    >
      <span
        className={`grid place-items-center border font-heading leading-none ${
          compact ? "size-7 text-base" : "size-8 text-lg"
        } ${inverse ? "border-paper-light/80" : "border-ink/70"}`}
      >
        B
      </span>
      <span className={`font-heading ${compact ? "text-xl" : "text-2xl"} tracking-[-0.045em]`}>
        BluBook
      </span>
    </span>
  );
}
