import {
  Bone,
  SkeletonField,
  SkeletonFields,
  SkeletonHeader,
  SkeletonPage,
  SkeletonPanel,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

/**
 * The loading state for the five document submissions — purchase order, sales
 * order, tender, RFFA and RFQ — which share one page shape: header, one
 * panel, the submission form inside it. The sales order adds a pipeline
 * fieldset above the fields; the tender family has fewer of them.
 */
export function TransactionSubmissionSkeleton({
  variant = "order",
}: {
  variant?: "order" | "sales_order" | "tender";
}) {
  return (
    <SkeletonPage width="max-w-4xl">
      <SkeletonHeader titleWidth="w-72" />
      <SkeletonPanel>
        <div className="space-y-5">
          {variant === "sales_order" ? (
            <fieldset className="space-y-4 border border-ink/45 bg-paper p-4">
              <Bone tone="title" className="h-4 w-40" />
              <div className="flex gap-6">
                <Bone className="h-4 w-36" />
                <Bone className="h-4 w-36" />
              </div>
              <SkeletonField />
            </fieldset>
          ) : null}

          {variant === "tender" ? (
            <>
              <SkeletonFields count={2} cols="sm:grid-cols-2" />
              <SkeletonField />
              <SkeletonField />
            </>
          ) : (
            <>
              <SkeletonFields count={2} cols="sm:grid-cols-2" />
              <SkeletonField tall />
              <SkeletonFields count={2} cols="sm:grid-cols-2" />
            </>
          )}
          <SkeletonField tall />

          {/* The documents dropzone. */}
          <div className="border border-ink/45 bg-paper p-4">
            <Bone className="h-3 w-40" />
            <Bone tone="field" className="mt-3 h-10 w-full" />
            <Bone className="mt-3 h-2.5 w-2/3" />
          </div>

          <SkeletonSubmitRow />
        </div>
      </SkeletonPanel>
    </SkeletonPage>
  );
}
