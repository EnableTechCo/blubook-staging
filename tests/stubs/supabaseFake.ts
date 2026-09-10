import { vi } from "vitest";

/**
 * A chainable stand-in for the Supabase query builder, for unit-testing the
 * read services without a database.
 *
 * Results are queued PER TABLE and consumed in call order, because several
 * services hit the same table more than once inside one Promise.all — the
 * staff dashboard reads service_requests three times, the onboarding queue
 * reads clients twice. A single "next result" would hand the wrong row to the
 * wrong query and the test would pass for the wrong reason.
 *
 * Every chain method returns the same builder. The builder is itself thenable,
 * so `await supabase.from(t).select(...)` (the head/count form) resolves the
 * next queued result exactly as `.returns()` / `.maybeSingle()` do.
 */

type Result = { data?: unknown; count?: number | null; error?: unknown };

const CHAIN = [
  "select", "eq", "in", "is", "not", "ilike", "order", "limit", "returns",
] as const;

export function makeSupabaseFake(queues: Record<string, Result[]> = {}) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  // Typed loosely on purpose: the default is an empty result, but tests queue
  // real rows with mockResolvedValueOnce, and an inferred `never[]` would refuse them.
  const rpc = vi.fn(
    async (): Promise<{ data: unknown[] | null; error: unknown }> => ({ data: [], error: null }),
  );

  const from = vi.fn((table: string) => {
    const take = (): Result => {
      const q = queues[table] ?? [];
      if (q.length === 0) throw new Error(`supabaseFake: no queued result left for "${table}"`);
      return q.shift()!;
    };
    const builder: Record<string, unknown> = {};
    for (const m of CHAIN) {
      builder[m] = vi.fn((...args: unknown[]) => {
        calls.push({ table, method: m, args });
        return builder;
      });
    }
    builder.maybeSingle = vi.fn(async () => take());
    builder.single = vi.fn(async () => take());
    builder.then = (onOk: (r: Result) => unknown, onErr?: (e: unknown) => unknown) =>
      Promise.resolve().then(take).then(onOk, onErr);
    return builder;
  });

  /** Arguments passed to `method` on `table`, across every call, in order. */
  const argsOf = (table: string, method: string) =>
    calls.filter((c) => c.table === table && c.method === method).map((c) => c.args);

  return { client: { from, rpc }, from, rpc, calls, argsOf };
}

/** Wire the fake into `@/lib/supabase/server` for one test file. */
export function mockCreateClient(fake: ReturnType<typeof makeSupabaseFake>) {
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn(async () => fake.client),
  }));
}
