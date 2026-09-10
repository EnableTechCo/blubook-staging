import {
  Bone,
  SkeletonFrame,
  SkeletonHeader,
  SkeletonPage,
  SkeletonRecords,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-48" />
      <div className="space-y-5">
        {/* Upload a product list */}
        <SkeletonFrame>
          <Bone tone="field" className="mt-4 h-10 w-full" />
          <SkeletonSubmitRow className="mt-4" secondary={false} />
        </SkeletonFrame>
        {/* Add a product, collapsed */}
        <div className="flex items-center justify-between border border-ink bg-paper-light px-5 py-4">
          <Bone tone="title" className="h-4 w-32" />
          <Bone className="h-3 w-3" />
        </div>
        <Bone className="h-3 w-32" />
        <SkeletonRecords count={5} metas={0} amount />
      </div>
    </SkeletonPage>
  );
}
