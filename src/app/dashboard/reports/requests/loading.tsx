import {
  Bone,
  SkeletonHeader,
  SkeletonMetricBand,
  SkeletonPage,
  SkeletonPanel,
  SkeletonTable,
} from "@/components/ui/Skeleton";

export default function RequestsReportLoading() {
  return (
    <SkeletonPage width="max-w-[96rem]">
      <SkeletonHeader titleWidth="w-56" />

      {/* The two stat strips */}
      <section className="space-y-5">
        {[0, 1].map((strip) => (
          <div key={strip}>
            <Bone className="mb-3 h-2.5 w-32" />
            <SkeletonMetricBand count={4} cols="grid-cols-2 lg:grid-cols-4" cell="p-4" />
          </div>
        ))}
      </section>

      <SkeletonPanel bodyClassName="!px-0 !pb-0">
        <SkeletonTable rows={8} cols={12} minWidth="min-w-[96rem]" />
      </SkeletonPanel>
    </SkeletonPage>
  );
}
