import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Vitest runs on Vite, whose import.meta.glob finds every loading file under
// this directory — so a new route's loading state is tested the moment it
// exists, with nothing to register. The tsconfig does not pull in Vite's
// client types, so the one signature used here is declared locally.
declare global {
  interface ImportMeta {
    glob<T>(pattern: string, options: { eager: true }): Record<string, T>;
  }
}

type LoadingModule = { default: () => React.JSX.Element };

// Every dashboard route's loading state, rendered once. The point is not
// what they look like — that is checked by eye — but that each one mounts,
// announces itself as busy, and contains no live text a screen reader would
// read out as content.
const loadingFiles = import.meta.glob<LoadingModule>("./**/loading.tsx", { eager: true });

describe("dashboard loading states", () => {
  const entries = Object.entries(loadingFiles);

  it("covers every dashboard section", () => {
    expect(entries.length).toBeGreaterThanOrEqual(36);
  });

  it.each(entries)("%s mounts as a busy region", (_path, mod) => {
    const { container, unmount } = render(<mod.default />);
    const region = container.firstElementChild;
    expect(region?.getAttribute("aria-busy")).toBe("true");
    expect(region?.className).toContain("mx-auto");
    expect(container.textContent?.trim()).toBe("Loading…");
    unmount();
  });
});
