import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center p-8">
      <section>
        <p className="text-sm font-medium text-sky-700">BluBook platform foundation</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">The technical skeleton is ready.</h1>
        <p className="mt-4 text-slate-600">No legacy functionality or product requirements are included.</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
