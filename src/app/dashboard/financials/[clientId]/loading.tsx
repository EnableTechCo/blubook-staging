import {
  Bone,
  SkeletonBackLink,
  SkeletonFields,
  SkeletonHeader,
  SkeletonPage,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

const GROUP_FIELDS = [3, 4, 4, 2];

function GroupCard({ fields }: { fields: number }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
      <div className="border-b border-ink/10 px-5 py-4">
        <Bone tone="title" className="h-4 w-40" />
        <Bone className="mt-2 h-3 w-64" />
      </div>
      <SkeletonFields count={fields} cols="sm:grid-cols-2 lg:grid-cols-4" gap="gap-5" className="p-5" />
    </section>
  );
}

export default function FinancialIntakeLoading() {
  return (
    <SkeletonPage width="max-w-[80rem]">
      <SkeletonHeader titleWidth="w-80" />
      <SkeletonBackLink />

      <SkeletonFields
        count={3}
        cols="sm:grid-cols-3"
        gap="gap-5"
        className="rounded-2xl border border-ink/10 bg-paper-light/75 p-5 shadow-surface"
      />

      <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
        <div className="border-b border-ink/10 px-5 py-4">
          <Bone tone="title" className="h-4 w-44" />
        </div>
        <div className="p-5">
          <Bone tone="field" className="h-10 w-full" />
        </div>
      </section>

      {GROUP_FIELDS.map((fields, index) => (
        <GroupCard key={index} fields={fields} />
      ))}

      <SkeletonSubmitRow />
    </SkeletonPage>
  );
}
