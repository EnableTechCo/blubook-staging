import type { Enums } from "@/types/database";

/**
 * The onboarding queue's vocabulary: its stages, how a request's query string
 * is read into them, and the counts the page summarises.
 *
 * STAGES is the only source of which values are valid, so the page validates
 * the query string against it rather than its own rendering list. All of this
 * is pure, so it lives here beside the stage filter it belongs with.
 */

export type OnboardingQueueStage =
  | "all"
  | "awaiting_approval"
  | "awaiting_documents"
  | "awaiting_review"
  | "rejected"
  | "complete";

/** The filter chips, in display order. Also the definition of a valid stage. */
export const STAGES: { value: OnboardingQueueStage; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting_approval", label: "Awaiting approval" },
  { value: "awaiting_documents", label: "Awaiting documents" },
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "rejected", label: "Rejected" },
  { value: "complete", label: "Complete" },
];

/** A `stage` query value, or "all" for anything that is not a known stage. */
export function parseQueueStage(raw: string | undefined): OnboardingQueueStage {
  return STAGES.some((option) => option.value === raw) ? (raw as OnboardingQueueStage) : "all";
}

/** A `q` query value: trimmed, capped at the length the search accepts. */
export function parseQueueQuery(raw: string | undefined): string {
  return raw?.trim().slice(0, 100) ?? "";
}

interface ApprovalTimes {
  submitted_at?: string | null;
  approved_at?: string | null;
}

/** A client that has submitted its onboarding and is not yet live. */
export function awaitsApproval(onboarding: ApprovalTimes): boolean {
  return Boolean(onboarding.submitted_at) && !onboarding.approved_at;
}

interface FilterableOnboarding extends ApprovalTimes {
  status: Enums<"onboarding_status">;
  onboarding_documents: { status: Enums<"compliance_status"> }[];
}

export function onboardingMatchesStage(
  onboarding: FilterableOnboarding,
  stage: OnboardingQueueStage,
): boolean {
  if (stage === "all") return true;
  if (stage === "awaiting_approval") return awaitsApproval(onboarding);
  if (stage === "awaiting_documents") return onboarding.status === "awaiting_documents";
  if (stage === "complete") return onboarding.status === "completed";

  const documentStatus = stage === "awaiting_review" ? "received" : stage;
  return onboarding.onboarding_documents.some((document) => document.status === documentStatus);
}

interface QueueSummary {
  cases: number;
  /** Clients who have submitted and are waiting to go live. */
  awaitingApproval: number;
  /** Documents submitted and waiting for a staff decision. */
  awaitingReview: number;
  /** Documents the client still has to submit. */
  outstanding: number;
}

/** The four figures on the queue's metric band, from one pass over the cases. */
export function summariseQueue(
  onboardings: (ApprovalTimes & { onboarding_documents: { status: Enums<"compliance_status"> }[] })[],
): QueueSummary {
  const summary: QueueSummary = { cases: onboardings.length, awaitingApproval: 0, awaitingReview: 0, outstanding: 0 };
  for (const onboarding of onboardings) {
    if (awaitsApproval(onboarding)) summary.awaitingApproval += 1;
    for (const document of onboarding.onboarding_documents) {
      if (document.status === "outstanding") summary.outstanding += 1;
      else if (document.status === "received") summary.awaitingReview += 1;
    }
  }
  return summary;
}

/**
 * The package a client chose, as the approval panel names it: the package
 * name and how many items it holds. Read from the stored assembly defensively —
 * it is JSON — and null when there is nothing usable to show.
 */
export function requestedPackageSummary(requested: unknown): { name: string; items: number } | null {
  if (!requested || typeof requested !== "object" || Array.isArray(requested)) return null;
  const { meta, snapshots } = requested as { meta?: { name?: unknown }; snapshots?: unknown };
  if (!meta || typeof meta.name !== "string" || !Array.isArray(snapshots)) return null;
  return { name: meta.name, items: snapshots.length };
}
