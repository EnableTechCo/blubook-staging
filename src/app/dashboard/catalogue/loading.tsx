import { Bone, SkeletonButton, SkeletonHeader, SkeletonPage, SkeletonSurface } from "@/components/ui/Skeleton";

export default function CatalogueLoading() {
  return (
    <SkeletonPage width="max-w-5xl" rhythm="">
      <SkeletonHeader titleWidth="w-56" aside={<SkeletonButton width="w-36" />} />
      <SkeletonSurface className="mt-8">
        <ul aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <li
              key={index}
              className="flex flex-wrap items-center gap-4 border-b border-ink/8 px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <Bone tone="title" className="h-4 w-48" />
                  <Bone tone="field" className="h-5 w-16 rounded-full" />
                </div>
                <Bone className="mt-2 h-3 w-64" />
              </div>
              <SkeletonButton width="w-16" />
              <SkeletonButton width="w-20" />
            </li>
          ))}
        </ul>
      </SkeletonSurface>
    </SkeletonPage>
  );
}
