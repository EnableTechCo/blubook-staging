import { Bone, SkeletonBackLink, SkeletonPage } from "@/components/ui/Skeleton";

/**
 * The loading state for a conversation — a request thread or a work-group
 * thread, which share one shape: back link, a tall heading, the bubbles,
 * and the composer at the foot.
 */
export function ThreadSkeleton() {
  return (
    <SkeletonPage width="max-w-4xl" rhythm="">
      <SkeletonBackLink />

      <header className="mt-6 border-b border-ink/20 pb-6">
        <div className="flex items-center gap-3">
          <Bone tone="field" className="h-6 w-24 rounded-full" />
          <Bone className="h-3 w-20" />
        </div>
        <Bone tone="title" className="mt-4 h-12 w-3/4 max-w-2xl" />
        <Bone className="mt-4 h-3.5 w-1/2" />
      </header>

      <div className="mt-6 space-y-4" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={`flex ${index % 2 ? "justify-end" : ""}`}>
            <div className="w-full max-w-[85%] border border-ink/15 bg-paper-light p-4">
              <div className="flex items-baseline justify-between gap-4">
                <Bone className="h-2.5 w-24" />
                <Bone className="h-2.5 w-16" />
              </div>
              <Bone className="mt-3 h-3.5 w-full" />
              <Bone className={`mt-2 h-3.5 ${index % 2 ? "w-1/2" : "w-4/5"}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-y border-ink/20 bg-paper p-4 sm:p-5">
        <Bone className="h-3 w-28" />
        <Bone tone="field" className="mt-2 h-24 w-full" />
        <div className="mt-3 flex items-center justify-between">
          <Bone className="h-2.5 w-48" />
          <Bone tone="title" className="h-10 w-28 rounded-md" />
        </div>
      </div>
    </SkeletonPage>
  );
}
