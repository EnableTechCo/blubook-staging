import {
  SkeletonBackLink,
  SkeletonField,
  SkeletonHeader,
  SkeletonPage,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

export default function ServiceRequestLoading() {
  return (
    <SkeletonPage width="max-w-3xl" rhythm="space-y-7">
      <SkeletonBackLink />
      <SkeletonHeader titleWidth="w-72" />
      <div className="space-y-4 border-y border-ink bg-paper p-5 sm:p-7">
        <SkeletonField help />
        <SkeletonField />
        <SkeletonField tall help />
        <SkeletonSubmitRow />
      </div>
    </SkeletonPage>
  );
}
