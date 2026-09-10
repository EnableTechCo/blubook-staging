import { SkeletonDataGrid, SkeletonHeader, SkeletonPage, SkeletonPanel } from "@/components/ui/Skeleton";

export default function PartnerTiersLoading() {
  return (
    <SkeletonPage width="max-w-[92rem]">
      <SkeletonHeader titleWidth="w-56" />
      <SkeletonPanel>
        <SkeletonDataGrid count={6} cols="sm:grid-cols-2" cell="px-4 py-3" />
      </SkeletonPanel>
    </SkeletonPage>
  );
}
