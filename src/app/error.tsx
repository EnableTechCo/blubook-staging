"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="p-8"><h1>Something went wrong.</h1><button type="button" onClick={reset}>Try again</button></main>;
}
