import { vi } from "vitest";

/**
 * A chainable stand-in for the Supabase client, for unit-testing services and
 * actions without a database.
 *
 * Results are queued PER TABLE and consumed in call order, because several
 * functions hit the same table more than once inside one Promise.all — the
 * staff dashboard reads service_requests three times, the onboarding queue
 * reads clients twice. A single "next result" would hand the wrong row to the
 * wrong query and the test would pass for the wrong reason.
 *
 * Every chain method returns the same builder and records its call. The
 * builder is itself thenable, so `await supabase.from(t).select(...)` (the
 * head/count form) resolves the next queued result exactly as `.returns()`,
 * `.single()` and `.maybeSingle()` do. Mutations (`insert`, `upsert`,
 * `update`, `delete`) are chain methods too, so `.insert(row).select("id")
 * .single()` reads one queued result, as it does for real.
 *
 * `storage.from(bucket).upload()` / `.remove()` and `auth.admin.*` are plain
 * spies that record what they were given, so an upload-then-rollback path can
 * be asserted: which bucket, which path, in which order.
 */

type Result = { data?: unknown; count?: number | null; error?: unknown };

const CHAIN = [
  "select", "insert", "upsert", "update", "delete",
  "eq", "neq", "in", "is", "not", "ilike", "like", "order", "limit", "returns",
] as const;

export function makeSupabaseFake(
  queues: Record<string, Result[]> = {},
  options: { uploadError?: { message: string } | null } = {},
) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];

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

  // Typed loosely on purpose: the default is an empty result, but tests queue
  // real rows with mockResolvedValueOnce, and an inferred `never[]` would refuse them.
  const rpc = vi.fn(
    async (): Promise<{ data: unknown[] | null; error: unknown }> => ({ data: [], error: null }),
  );

  const uploaded: { bucket: string; path: string; contentType?: string }[] = [];
  const removed: { bucket: string; paths: string[] }[] = [];
  const storage = {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn(async (path: string, _file: unknown, opts?: { contentType?: string }) => {
        if (options.uploadError) return { data: null, error: options.uploadError };
        uploaded.push({ bucket, path, contentType: opts?.contentType });
        return { data: { path }, error: null };
      }),
      remove: vi.fn(async (paths: string[]) => {
        removed.push({ bucket, paths });
        return { data: null, error: null };
      }),
    })),
  };

  const auth = {
    admin: {
      createUser: vi.fn(async (): Promise<{ data: { user: { id: string } | null }; error: unknown }> => ({
        data: { user: { id: "user-new" } },
        error: null,
      })),
      deleteUser: vi.fn(async () => ({ data: null, error: null })),
    },
  };

  /** Arguments passed to `method` on `table`, across every call, in order. */
  const argsOf = (table: string, method: string) =>
    calls.filter((c) => c.table === table && c.method === method).map((c) => c.args);

  /** The tables touched, in first-touch order — handy for asserting a rollback path. */
  const tablesTouched = () => [...new Set(calls.map((c) => c.table))];

  return {
    client: { from, rpc, storage, auth },
    from, rpc, storage, auth, calls, argsOf, tablesTouched, uploaded, removed,
  };
}

/** Wire the fake into `@/lib/supabase/server` for one test file. */
export function mockCreateClient(fake: ReturnType<typeof makeSupabaseFake>) {
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn(async () => fake.client),
  }));
}
