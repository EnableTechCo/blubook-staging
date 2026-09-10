import { Bone, SkeletonBackLink, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

export default function CustomerLoading() {
  return (
    <SkeletonPage width="max-w-5xl" rhythm="">
      <SkeletonBackLink />
      <div className="mt-3">
        <SkeletonHeader titleWidth="w-80" />
      </div>

      <section className="workspace-panel mt-7 grid sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="p-5 sm:border-r sm:border-ink/8 sm:last:border-r-0">
            <Bone className="h-2.5 w-24" />
            <Bone tone="title" className="mt-3 h-5 w-36" />
          </div>
        ))}
      </section>

      <div className="mt-8 space-y-3" aria-hidden="true">
        <Bone className="h-3.5 w-full max-w-2xl" />
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="grid min-h-20 items-center gap-3 overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 px-5 py-4 shadow-surface sm:grid-cols-[13rem_minmax(0,1fr)_auto]"
          >
            <Bone tone="title" className="h-4 w-36" />
            <Bone className="h-3 w-3/4" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
