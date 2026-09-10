import {
  Bone,
  SkeletonButton,
  SkeletonHeader,
  SkeletonPage,
  SkeletonPanel,
  SkeletonRecords,
} from "@/components/ui/Skeleton";

export default function PipelineLoading() {
  return (
    <SkeletonPage width="max-w-[96rem]">
      <SkeletonHeader titleWidth="w-56" />
      <SkeletonPanel>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Bone className="h-3 w-80 max-w-full" />
            <SkeletonButton width="w-40" />
          </div>
          <SkeletonRecords count={4} metas={3} metaCols="sm:grid-cols-3" amount actions />
        </div>
      </SkeletonPanel>
    </SkeletonPage>
  );
}
