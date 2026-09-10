import { Bone, SkeletonHeader, SkeletonPage, SkeletonPanel } from "@/components/ui/Skeleton";

export default function TargetsLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-48" />
      <SkeletonPanel>
        <ul className="grid border-l border-t border-ink" aria-hidden="true">
          {[0, 1, 2, 3].map((quarter) => (
            <li
              key={quarter}
              className="grid gap-4 border-b border-r border-ink p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end"
            >
              <Bone tone="title" className="h-7 w-10" />
              <div>
                <Bone className="h-3 w-24" />
                <Bone tone="field" className="mt-2 h-10 w-full max-w-xs" />
              </div>
              <Bone tone="title" className="h-7 w-28" />
            </li>
          ))}
        </ul>
      </SkeletonPanel>
    </SkeletonPage>
  );
}
