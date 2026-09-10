import {
  Bone,
  SkeletonField,
  SkeletonFields,
  SkeletonFrame,
  SkeletonHeader,
  SkeletonPage,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

export default function LetterheadLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-64" />

      {/* Banking details */}
      <SkeletonFrame>
        <SkeletonFields count={6} cols="sm:grid-cols-2" className="mt-5" />
        <SkeletonSubmitRow align="end" secondary={false} className="mt-5 border-t border-ink/30 pt-5" />
      </SkeletonFrame>

      {/* Letterhead */}
      <SkeletonFrame>
        <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-start gap-3 border border-ink/20 bg-paper px-4 py-3">
              <Bone tone="field" className="mt-1 size-4" />
              <div className="min-w-0 flex-1">
                <Bone tone="title" className="h-3.5 w-24" />
                <Bone className="mt-2 h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
        <SkeletonFields count={3} cols="sm:grid-cols-3" className="mt-4" />
        <SkeletonField help className="mt-4" />
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-ink/30 pt-5">
          <Bone tone="field" className="h-10 w-52" />
          <Bone tone="title" className="h-10 w-36 rounded-md" />
        </div>
      </SkeletonFrame>
    </SkeletonPage>
  );
}
