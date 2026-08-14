import Image from "next/image";

export function BrandMark({
  compact = false,
  inverse = false,
  priority = false,
}: {
  compact?: boolean;
  inverse?: boolean;
  priority?: boolean;
}) {
  const asset = compact
    ? {
        src: "/images/blubook-b-mark.png",
        width: 826,
        height: 744,
        className: "h-9 w-auto",
      }
    : {
        src: "/images/blubook-wordmark.png",
        width: 1279,
        height: 340,
        className: "h-9 w-auto sm:h-10",
      };

  return (
    <span
      className={`inline-flex items-center ${inverse ? "drop-shadow-[0_1px_1px_rgba(255,255,255,0.12)]" : ""}`}
      aria-hidden="true"
    >
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        className={asset.className}
        sizes={compact ? "36px" : "160px"}
        priority={priority}
      />
    </span>
  );
}
