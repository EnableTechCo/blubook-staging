import { redirect } from "next/navigation";

// The performance view now opens the client dashboard, so this page has no
// content of its own. It stays as a redirect rather than being deleted, so
// existing links and bookmarks land on the dashboard instead of a 404.
//
// Partners have no performance view for the moment: their dashboard was left
// unchanged, so this redirect takes them to a page that does not carry one.
export default function PerformancePage() {
  redirect("/dashboard");
}
