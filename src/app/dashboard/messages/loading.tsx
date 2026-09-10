import { Bone, SkeletonHeader, SkeletonPage, SkeletonSurface } from "@/components/ui/Skeleton";

function InboxRows({ count }: { count: number }) {
  return (
    <ul aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex items-baseline gap-4 border-b border-ink/8 px-4 py-4 last:border-b-0">
          <Bone className="h-3 w-24 shrink-0" />
          <div className="min-w-0 flex-1">
            <Bone tone="title" className="h-4 w-2/3" />
            <Bone className="mt-2 h-3 w-5/6" />
          </div>
          <Bone tone="field" className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
          <Bone className="h-3 w-14 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

export default function MessagesLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-40" />
      <section>
        <Bone tone="title" className="mb-3 h-5 w-32" />
        <SkeletonSurface>
          <InboxRows count={2} />
        </SkeletonSurface>
      </section>
      <section>
        <Bone tone="title" className="mb-3 h-5 w-28" />
        <SkeletonSurface>
          <InboxRows count={6} />
        </SkeletonSurface>
      </section>
    </SkeletonPage>
  );
}
