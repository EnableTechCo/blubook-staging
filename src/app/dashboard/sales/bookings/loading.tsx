import { Bone, SkeletonHeader, SkeletonPage, SkeletonRecords } from "@/components/ui/Skeleton";

export default function BookingsLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-48" />
      <div className="space-y-3">
        <Bone className="h-3 w-40" />
        <SkeletonRecords count={3} metas={3} metaCols="sm:grid-cols-3" amount />
      </div>
    </SkeletonPage>
  );
}
