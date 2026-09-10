import {
  Bone,
  SkeletonBackLink,
  SkeletonButton,
  SkeletonHeader,
  SkeletonMetricBand,
  SkeletonPage,
} from "@/components/ui/Skeleton";

function CasePanel({ rows }: { rows: number }) {
  return (
    <article className="workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <Bone tone="title" className="h-5 w-56" />
          <Bone className="mt-2.5 h-3 w-40" />
        </div>
        <Bone tone="field" className="h-6 w-28 rounded-full" />
      </div>
      <ul className="divide-y divide-ink/8" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1.6fr)] lg:items-start"
          >
            <div>
              <Bone className="h-2.5 w-20" />
              <Bone tone="title" className="mt-2 h-4 w-44" />
              <Bone tone="field" className="mt-3 h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-2">
              <Bone className="h-3 w-full" />
              <Bone tone="field" className="h-10 w-full max-w-md" />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function OnboardingsLoading() {
  return (
    <SkeletonPage width="max-w-[92rem]" rhythm="space-y-7">
      <SkeletonBackLink />
      <SkeletonHeader titleWidth="w-64" aside={<SkeletonButton width="w-40" />} />

      <section className="workspace-panel p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div>
            <Bone className="h-3 w-40" />
            <Bone tone="field" className="mt-2 h-10 w-full" />
          </div>
          <SkeletonButton width="w-24" />
          <SkeletonButton width="w-20" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/8 pt-4" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => (
            <Bone key={index} tone="field" className="h-8 w-32 rounded-full" />
          ))}
        </div>
      </section>

      <SkeletonMetricBand count={4} cols="sm:grid-cols-2 xl:grid-cols-4" />

      <div className="space-y-6">
        <CasePanel rows={3} />
        <CasePanel rows={2} />
      </div>
    </SkeletonPage>
  );
}
