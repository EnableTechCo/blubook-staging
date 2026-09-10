import {
  Bone,
  SkeletonBackLink,
  SkeletonFields,
  SkeletonHeader,
  SkeletonPage,
  SkeletonSubmitRow,
} from "@/components/ui/Skeleton";

const STEP_FIELDS = [6, 5, 3, 6];

export default function OnboardLoading() {
  return (
    <SkeletonPage width="max-w-5xl" rhythm="">
      <SkeletonBackLink />
      <div className="mt-3">
        <SkeletonHeader titleWidth="w-72" />
      </div>

      <div aria-hidden="true">
        {STEP_FIELDS.map((fields, index) => (
          <fieldset
            key={index}
            className="grid gap-5 border-t border-ink py-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10"
          >
            <div>
              <Bone className="h-2.5 w-14" />
              <Bone tone="title" className="mt-3 h-5 w-40" />
              <Bone className="mt-3 h-3 w-full max-w-[11rem]" />
              <Bone className="mt-1.5 h-3 w-2/3" />
            </div>
            <SkeletonFields count={fields} cols="sm:grid-cols-2" gap="gap-5" />
          </fieldset>
        ))}
        <SkeletonSubmitRow align="end" className="border-t border-ink py-6" />
      </div>
    </SkeletonPage>
  );
}
