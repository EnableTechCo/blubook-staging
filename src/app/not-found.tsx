import Link from "next/link";

export default function NotFound() {
  return <main className="p-8"><h1>Page not found</h1><Link href="/">Return home</Link></main>;
}
