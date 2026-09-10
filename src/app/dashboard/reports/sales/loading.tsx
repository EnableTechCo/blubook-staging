import {
  Bone,
  SkeletonHeader,
  SkeletonMetricCard,
  SkeletonPage,
  SkeletonPanel,
} from "@/components/ui/Skeleton";

function ChartFigure() {
  return (
    <figure className="border border-ink bg-paper">
      <div className="border-b border-ink/15 px-5 py-4">
        <Bone tone="title" className="h-4 w-40" />
        <Bone className="mt-2 h-3 w-64" />
      </div>
      <div className="p-4">
        <Bone tone="block" className="h-56 w-full" />
      </div>
      <div className="flex gap-6 border-t border-ink/15 px-5 py-3">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-2.5 w-20" />
      </div>
    </figure>
  );
}

export default function SalesReportLoading() {
  return (
    <SkeletonPage width="max-w-[80rem]">
      <SkeletonHeader titleWidth="w-56" />

      <nav className="flex flex-wrap items-center gap-2" aria-hidden="true">
        <Bone className="mr-2 h-3 w-16" />
        {[0, 1, 2, 3].map((index) => (
          <Bone key={index} tone="field" className="h-8 w-14" />
        ))}
      </nav>

      <SkeletonMetricCard tiles={5} cols="grid-cols-1 sm:grid-cols-3 lg:grid-cols-5" />

      <SkeletonPanel bodyClassName="!p-0">
        <div className="grid grid-cols-1 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="workspace-metric-cell border-b border-r p-5">
              <Bone tone="title" className="h-7 w-14" />
              <Bone className="mt-3 h-2.5 w-24" />
            </div>
          ))}
        </div>
      </SkeletonPanel>

      <ChartFigure />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartFigure />
        <ChartFigure />
      </div>
    </SkeletonPage>
  );
}
