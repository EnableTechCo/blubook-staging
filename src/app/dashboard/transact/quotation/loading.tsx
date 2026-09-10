import {
  Bone,
  SkeletonField,
  SkeletonFrame,
  SkeletonHeader,
  SkeletonPage,
  SkeletonRecords,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

export default function QuotationLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-64" />

      <div className="space-y-5">
        {/* Who it is for */}
        <SkeletonFrame intro={false}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
            <SkeletonField className="sm:col-span-2" />
          </div>
        </SkeletonFrame>

        {/* What is being quoted */}
        <SkeletonFrame intro={false}>
          <ul className="workspace-data-grid mt-4 grid" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <li key={index} className="workspace-data-cell flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Bone tone="title" className="h-4 w-64 max-w-full" />
                  <Bone className="mt-2 h-2.5 w-24" />
                </div>
                <Bone tone="field" className="h-10 w-28 shrink-0" />
              </li>
            ))}
          </ul>
          <SkeletonField tall className="mt-4" />
        </SkeletonFrame>

        {/* Add this to my pipeline */}
        <div className="flex items-start gap-3 border border-ink/20 bg-paper px-4 py-3">
          <Bone tone="field" className="mt-1 size-4" />
          <div className="min-w-0 flex-1">
            <Bone tone="title" className="h-3.5 w-48" />
            <Bone className="mt-2 h-3 w-full max-w-lg" />
          </div>
        </div>

        {/* Totals and submit */}
        <SkeletonFrame heading={false} intro={false}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Bone className="h-2.5 w-16" />
              <Bone className="mt-2 h-3 w-40" />
            </div>
            <Bone tone="title" className="h-9 w-36" />
          </div>
          <SkeletonSubmitRow align="end" secondary={false} className="mt-5 border-t border-ink/30 pt-5" />
        </SkeletonFrame>
      </div>

      <section>
        <Bone tone="title" className="mb-4 h-6 w-64" />
        <SkeletonRecords count={2} metas={2} metaCols="sm:grid-cols-2" amount />
      </section>
    </SkeletonPage>
  );
}
