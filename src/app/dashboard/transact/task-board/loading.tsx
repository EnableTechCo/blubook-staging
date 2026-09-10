import {
  Bone,
  SkeletonField,
  SkeletonFields,
  SkeletonFrame,
  SkeletonHeader,
  SkeletonPage,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

const CARDS_PER_COLUMN = [3, 2, 1];

export default function TaskBoardLoading() {
  return (
    <SkeletonPage width="max-w-5xl">
      <SkeletonHeader titleWidth="w-48" />

      <div className="space-y-6">
        {/* Add a task */}
        <SkeletonFrame>
          <div className="mt-4 space-y-4">
            <SkeletonField />
            <SkeletonField tall />
            <SkeletonFields count={2} cols="sm:grid-cols-2" />
            <SkeletonSubmitRow align="end" secondary={false} className="border-t border-ink/30 pt-4" />
          </div>
        </SkeletonFrame>

        {/* The three columns */}
        <div className="grid gap-4 lg:grid-cols-3" aria-hidden="true">
          {CARDS_PER_COLUMN.map((cards, column) => (
            <section key={column}>
              <div className="flex items-baseline justify-between border-b border-ink/20 pb-2">
                <Bone tone="title" className="h-4 w-24" />
                <Bone className="h-3 w-5" />
              </div>
              <ul className="mt-3 space-y-3">
                {Array.from({ length: cards }, (_, index) => (
                  <li key={index} className="border border-ink/15 bg-paper-light px-4 py-3">
                    <Bone tone="title" className="h-4 w-3/4" />
                    <Bone className="mt-2 h-3 w-full" />
                    <div className="mt-3 flex gap-2">
                      <Bone tone="field" className="h-5 w-20 rounded-full" />
                      <Bone tone="field" className="h-5 w-24 rounded-full" />
                    </div>
                    <div className="mt-3 flex gap-3 border-t border-ink/10 pt-3">
                      <Bone className="h-3 w-14" />
                      <Bone className="h-3 w-14" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
