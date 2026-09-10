import { Bone, SkeletonHeader, SkeletonPage, SkeletonPanel } from "@/components/ui/Skeleton";

export default function StaffRolesLoading() {
  return (
    <SkeletonPage width="max-w-[92rem]">
      <SkeletonHeader titleWidth="w-48" />
      <SkeletonPanel>
        <ul className="workspace-data-grid grid" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="workspace-data-cell px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <Bone tone="title" className="h-4 w-44" />
                  <Bone className="mt-2 h-3 w-56" />
                  <Bone className="mt-2 h-3 w-72 max-w-full" />
                </div>
                <div className="flex items-end gap-3">
                  <Bone tone="field" className="h-10 w-40" />
                  <Bone tone="title" className="h-10 w-20 rounded-md" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </SkeletonPanel>
    </SkeletonPage>
  );
}
