import { Bone, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

export default function FinancialsLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-56" />

      <div className="workspace-panel px-5 py-4">
        <Bone className="h-2.5 w-32" />
        <Bone tone="title" className="mt-3 h-9 w-48" />
        <Bone className="mt-3 h-3 w-72 max-w-full" />
      </div>

      <ul className="grid border-l border-t border-ink" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <li
            key={index}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-r border-ink bg-paper px-5 py-4"
          >
            <div>
              <Bone className="h-2.5 w-20" />
              <Bone tone="title" className="mt-2 h-4 w-56" />
              <Bone className="mt-2 h-3 w-40" />
            </div>
            <div className="flex items-center gap-3">
              <Bone tone="field" className="h-6 w-20 rounded-full" />
              <Bone className="h-3 w-3" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}
