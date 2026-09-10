import { Bone, SkeletonHeader, SkeletonMetricBand, SkeletonPage } from "@/components/ui/Skeleton";

function BarPanel() {
  return (
    <section className="workspace-panel p-5 sm:p-6">
      <Bone className="h-2.5 w-20" />
      <Bone tone="title" className="mt-3 h-6 w-56" />
      <div className="mt-7 space-y-5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index}>
            <div className="flex items-baseline justify-between">
              <Bone className="h-3 w-40" />
              <Bone className="h-3 w-8" />
            </div>
            <div className="mt-2 h-2 rounded-full bg-cream">
              <Bone tone="title" className={`h-2 rounded-full ${["w-4/5", "w-3/5", "w-1/2", "w-1/3", "w-1/4"][index]}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PerformanceLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-64" />
      <SkeletonMetricBand count={4} cols="sm:grid-cols-2 xl:grid-cols-4" />
      <div className="grid gap-8 xl:grid-cols-2">
        <BarPanel />
        <BarPanel />
      </div>
    </SkeletonPage>
  );
}
