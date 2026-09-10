import {
  Bone,
  SkeletonBackLink,
  SkeletonButton,
  SkeletonFields,
  SkeletonHeader,
  SkeletonPage,
} from "@/components/ui/Skeleton";

const RAIL = 9;

/** The wizard: a stage rail on the left, the first stage's panel on the right. */
export default function OnboardLoading() {
  return (
    <SkeletonPage width="max-w-6xl" rhythm="">
      <SkeletonBackLink />
      <div className="mt-3">
        <SkeletonHeader titleWidth="w-72" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10" aria-hidden="true">
        <div>
          <Bone className="h-2.5 w-24" />
          <ol className="mt-3 flex gap-2 overflow-hidden lg:block lg:space-y-1">
            {Array.from({ length: RAIL }, (_, index) => (
              <li key={index} className="flex shrink-0 items-start gap-3 rounded-md px-3 py-2.5">
                <Bone tone="field" className="mt-0.5 size-5 rounded-full" />
                <div>
                  <Bone tone={index === 0 ? "title" : "line"} className="h-3.5 w-32" />
                  {index > 3 && index < RAIL - 2 ? <Bone className="mt-1.5 h-2.5 w-20" /> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <div>
              <Bone className="h-2.5 w-14" />
              <Bone tone="title" className="mt-3 h-5 w-44" />
              <Bone className="mt-2.5 h-3 w-80 max-w-full" />
            </div>
          </div>
          <div className="workspace-panel-body space-y-5">
            <Bone tone="field" className="h-14 w-full" />
            <SkeletonFields count={2} cols="sm:grid-cols-2" gap="gap-5" />
            <Bone className="h-3.5 w-72" />
            <SkeletonFields count={2} cols="sm:grid-cols-2" gap="gap-5" />
            <SkeletonFields count={1} cols="" gap="gap-5" />
          </div>
          <div className="flex items-center justify-between border-t border-ink/10 px-5 py-4 sm:px-6">
            <Bone className="h-3 w-14" />
            <SkeletonButton width="w-40" />
          </div>
        </section>
      </div>
    </SkeletonPage>
  );
}
