import { Bone, SkeletonHeader, SkeletonPage, SkeletonPanel } from "@/components/ui/Skeleton";

function ListColumn({ rows }: { rows: number }) {
  return (
    <div>
      <Bone className="h-2.5 w-32" />
      <ul className="mt-2 space-y-1" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="border-b border-ink/12 py-2">
            <Bone className="h-3.5 w-3/4" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WorkGroupsLoading() {
  return (
    <SkeletonPage width="max-w-[92rem]">
      <SkeletonHeader titleWidth="w-48" />

      <SkeletonPanel>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <Bone className="h-3 w-24" />
            <Bone tone="field" className="mt-2 h-10 w-full" />
          </div>
          <Bone tone="title" className="h-10 w-24 rounded-md" />
        </div>
      </SkeletonPanel>

      <div className="space-y-6">
        {[0, 1].map((group) => (
          <SkeletonPanel key={group}>
            <div className="grid gap-6 lg:grid-cols-2">
              <ListColumn rows={4} />
              <ListColumn rows={3} />
            </div>
          </SkeletonPanel>
        ))}
      </div>

      <SkeletonPanel>
        <div className="flex flex-wrap gap-2" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <Bone key={index} tone="field" className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </SkeletonPanel>
    </SkeletonPage>
  );
}
