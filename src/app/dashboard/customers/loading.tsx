import {
  Bone,
  SkeletonButton,
  SkeletonHeader,
  SkeletonPage,
  SkeletonRecords,
} from "@/components/ui/Skeleton";

export default function CustomersLoading() {
  return (
    <SkeletonPage width="max-w-[92rem]" rhythm="space-y-7">
      <SkeletonHeader titleWidth="w-48" aside={<SkeletonButton width="w-40" />} />

      <section className="workspace-panel p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div>
            <Bone className="h-3 w-40" />
            <Bone tone="field" className="mt-2 h-10 w-full" />
          </div>
          <SkeletonButton width="w-24" />
          <SkeletonButton width="w-20" />
        </div>
        <Bone className="mt-3 h-3 w-32" />
      </section>

      <SkeletonRecords count={4} metas={4} metaCols="sm:grid-cols-2 lg:grid-cols-4" actions={false} />
    </SkeletonPage>
  );
}
