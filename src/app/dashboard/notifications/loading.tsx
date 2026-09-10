import { Bone, SkeletonButton, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

function NotificationRows({ count }: { count: number }) {
  return (
    <ul aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex items-start gap-4 border-b border-ink/8 px-4 py-4 last:border-b-0">
          <Bone tone="field" className="mt-1 size-3 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Bone tone="title" className="h-4 w-3/5" />
            <Bone className="mt-2 h-3 w-full" />
            <Bone className="mt-1.5 h-3 w-1/3" />
          </div>
          <Bone className="h-3 w-16 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

export default function NotificationsLoading() {
  return (
    <SkeletonPage width="max-w-4xl">
      <SkeletonHeader titleWidth="w-48" aside={<SkeletonButton width="w-32" />} />
      <div className="space-y-8">
        <section className="overflow-hidden rounded-2xl border border-negative/20 bg-paper-light/80 shadow-surface">
          <div className="border-b border-negative/20 bg-negative-wash px-4 py-3">
            <Bone tone="title" className="h-3.5 w-24" />
          </div>
          <NotificationRows count={2} />
        </section>
        {[0, 1].map((group) => (
          <section
            key={group}
            className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/80 shadow-surface"
          >
            <div className="flex items-center justify-between border-b border-ink/10 bg-cobalt-wash/25 px-4 py-3">
              <Bone tone="title" className="h-3.5 w-32" />
              <Bone className="h-3 w-3" />
            </div>
            <NotificationRows count={3} />
          </section>
        ))}
      </div>
    </SkeletonPage>
  );
}
