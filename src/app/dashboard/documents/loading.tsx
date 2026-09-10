import { Bone, SkeletonButton, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

export default function DocumentsLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader
        titleWidth="w-64"
        aside={
          <div className="flex gap-3">
            <SkeletonButton width="w-28" />
            <SkeletonButton width="w-36" />
          </div>
        }
      />

      <nav className="flex items-center gap-2" aria-hidden="true">
        <Bone className="h-3 w-20" />
      </nav>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li
            key={index}
            className="flex min-h-28 flex-col justify-between rounded-2xl border border-ink/10 bg-paper-light/75 p-4 shadow-surface"
          >
            <Bone tone="title" className="h-4 w-2/3" />
            <div className="mt-6 flex items-center justify-between">
              <Bone className="h-2.5 w-24" />
              <Bone className="h-2.5 w-10" />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-2xl border border-dashed border-ink/20 px-4 py-4">
        <Bone className="h-3.5 w-40" />
        <Bone className="h-3 w-10" />
      </div>
    </SkeletonPage>
  );
}
