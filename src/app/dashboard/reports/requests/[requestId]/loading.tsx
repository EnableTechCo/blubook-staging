import {
  Bone,
  SkeletonBackLink,
  SkeletonDataGrid,
  SkeletonHeader,
  SkeletonPage,
  SkeletonPanel,
  SkeletonRows,
} from "@/components/ui/Skeleton";

export default function RequestDetailLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonBackLink />
      <SkeletonHeader
        titleWidth="w-96"
        description={false}
        aside={<Bone tone="field" className="h-6 w-24 rounded-full" />}
      />

      <SkeletonPanel action>
        <SkeletonDataGrid count={8} cols="sm:grid-cols-2 lg:grid-cols-4" cell="p-4" />
        <div className="mt-6 space-y-2">
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-11/12" />
          <Bone className="h-3.5 w-2/3" />
        </div>
      </SkeletonPanel>

      <SkeletonPanel bodyClassName="!p-0">
        <SkeletonRows count={3} className="divide-y divide-ink border-y border-ink" row="px-5 py-4 sm:px-6" />
      </SkeletonPanel>

      <SkeletonPanel bodyClassName="!p-0">
        <SkeletonRows count={4} className="divide-y divide-ink/8" row="px-5 py-3 sm:px-6" pill={false} />
      </SkeletonPanel>
    </SkeletonPage>
  );
}
