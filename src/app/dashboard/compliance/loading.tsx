import { Bone, SkeletonButton, SkeletonHeader, SkeletonPage } from "@/components/ui/Skeleton";

export default function ComplianceLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-72" />

      <div className="border-l-[3px] border-ink/20 bg-cream/45 px-4 py-3">
        <Bone className="h-3 w-full max-w-xl" />
      </div>

      <section className="border-t border-ink bg-paper px-5 py-5">
        <Bone tone="title" className="h-6 w-48" />
        <Bone className="mt-3 h-3 w-full max-w-2xl" />
        <SkeletonButton width="w-40" className="mt-4" />
      </section>

      <ul className="grid border-l border-t border-ink" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <li key={index} className="border-b border-r border-ink bg-paper p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:items-end">
              <div>
                <Bone tone="title" className="h-4 w-48" />
                <Bone className="mt-2 h-3 w-72 max-w-full" />
              </div>
              {[0, 1, 2].map((field) => (
                <div key={field}>
                  <Bone className="h-2.5 w-16" />
                  <Bone tone="field" className="mt-2 h-10 w-28" />
                </div>
              ))}
              <Bone tone="title" className="h-10 w-20 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}
