import { SkeletonActionCards, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

export default function TransactLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-56" />
      <SkeletonActionCards count={9} cols="sm:grid-cols-2 lg:grid-cols-3" />
    </SkeletonPage>
  );
}
