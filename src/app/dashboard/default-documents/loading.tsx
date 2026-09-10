import {
  SkeletonField,
  SkeletonFields,
  SkeletonHeader,
  SkeletonPage,
  SkeletonPanel,
  SkeletonRows,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

export default function DefaultDocumentsLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-64" />
      <SkeletonPanel bodyClassName="!p-0">
        <SkeletonRows count={4} className="divide-y divide-ink border-y border-ink" row="px-5 py-4 sm:px-6" />
      </SkeletonPanel>
      <SkeletonPanel>
        <div className="space-y-4">
          <SkeletonFields count={2} cols="sm:grid-cols-2" />
          <SkeletonField tall />
          <SkeletonSubmitRow secondary={false} />
        </div>
      </SkeletonPanel>
    </SkeletonPage>
  );
}
