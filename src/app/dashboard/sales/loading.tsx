import { SkeletonActionCards, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

export default function SalesLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-40" />
      <SkeletonActionCards count={5} cols="sm:grid-cols-2" />
    </SkeletonPage>
  );
}
