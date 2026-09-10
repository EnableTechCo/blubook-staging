import { describe, expect, it } from "vitest";
import { formUuid } from "@/lib/validation/form";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

describe("formUuid", () => {
  it("returns the id when the field is a well-formed uuid", () => {
    expect(formUuid(form({ taskId: "3f1a6d2e-1c4b-4a9e-9c3d-0b7a5e2f8c41" }), "taskId")).toBe(
      "3f1a6d2e-1c4b-4a9e-9c3d-0b7a5e2f8c41",
    );
  });

  it("returns null for a missing field", () => {
    expect(formUuid(form({}), "taskId")).toBeNull();
  });

  it.each([
    ["not-a-uuid"],
    ["3f1a6d2e-1c4b-4a9e-9c3d"],           // truncated
    ["3f1a6d2e1c4b4a9e9c3d0b7a5e2f8c41"],  // no hyphens
    [""],
  ])("returns null for a malformed value: %s", (value) => {
    expect(formUuid(form({ taskId: value }), "taskId")).toBeNull();
  });

  it("does not confuse one field for another", () => {
    const fd = form({ packageId: "3f1a6d2e-1c4b-4a9e-9c3d-0b7a5e2f8c41" });
    expect(formUuid(fd, "taskId")).toBeNull();
  });
});
