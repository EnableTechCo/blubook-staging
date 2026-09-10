import { SkeletonActionCards, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

export default function ReportsLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-40" />
      <SkeletonActionCards count={4} cols="sm:grid-cols-2 lg:grid-cols-3" />
    </SkeletonPage>
  );
}
