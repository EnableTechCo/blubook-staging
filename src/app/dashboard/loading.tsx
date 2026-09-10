import {
  Bone,
  SkeletonHeader,
  SkeletonMetricBand,
  SkeletonMetricCard,
  SkeletonPage,
  SkeletonPanel,
  SkeletonRows,
} from "@/components/ui/Skeleton";

/**
 * The dashboard home while it loads.
 *
 * A loading file cannot know the caller's role, so this follows the shape the
 * three dashboards share — header with an aside tile, the business pulse, a
 * metric card, a metric band, a panel of rows — sized to the client view,
 * which is the one most people see. It also stands in for any nested route
 * that has no loading file of its own.
 */
export default function DashboardLoading() {
  return (
    <SkeletonPage width="max-w-[90rem]">
      <SkeletonHeader
        titleWidth="w-80"
        aside={
          <div className="workspace-panel w-full sm:w-56 lg:w-72">
            <Bone tone="block" className="m-3 h-20 rounded-md" />
            <div className="flex items-center justify-between border-t border-ink/8 px-4 py-3">
              <Bone className="h-2.5 w-20" />
              <Bone tone="field" className="h-5 w-16 rounded-full" />
            </div>
          </div>
        }
      />

      {/* The business pulse: a lead on the left, three figures on the right. */}
      <section className="grid overflow-hidden rounded-[0.875rem] border border-ink/10 bg-paper-light/75 md:grid-cols-[minmax(0,1.2fr)_minmax(28rem,0.8fr)]">
        <div className="p-5">
          <Bone className="h-2.5 w-20" />
          <Bone tone="title" className="mt-4 h-7 w-72 max-w-full" />
          <Bone className="mt-4 h-3 w-full max-w-[38rem]" />
          <Bone className="mt-2 h-3 w-3/4 max-w-[38rem]" />
        </div>
        <dl className="grid grid-cols-3 divide-x divide-ink/8 border-t border-ink/8 md:border-l md:border-t-0">
          {[0, 1, 2].map((index) => (
            <div key={index} className="p-5">
              <Bone className="h-2.5 w-16" />
              <Bone tone="title" className="mt-3 h-8 w-20" />
              <Bone className="mt-3 h-2.5 w-24" />
            </div>
          ))}
        </dl>
      </section>

      <SkeletonMetricCard tiles={5} cols="grid-cols-1 sm:grid-cols-3 lg:grid-cols-5" />

      <SkeletonMetricBand count={4} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />

      <SkeletonPanel bodyClassName="!p-0">
        <SkeletonRows count={5} row="px-5 py-3.5" />
      </SkeletonPanel>
    </SkeletonPage>
  );
}
