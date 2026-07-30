import { isSameSastDay, SAST, SAST_LOCALE } from "@/lib/time";

// Counterparties are anonymous to each other, so every message is attributed by
// role — never by name.
export const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  provider: "Provider",
  staff: "BluBook staff",
};

// Short, relative-ish stamp for inbox rows: time today, day+month otherwise.
// "Today" is the South African day, not the host's — otherwise a message sent
// at 01:00 SAST looks like yesterday to a server rendering in UTC.
export function inboxTime(iso: string): string {
  const date = new Date(iso);

  return isSameSastDay(date, new Date())
    ? date.toLocaleTimeString(SAST_LOCALE, {
        timeZone: SAST,
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString(SAST_LOCALE, {
        timeZone: SAST,
        day: "numeric",
        month: "short",
      });
}

// Full stamp inside a conversation.
export function messageTime(iso: string): string {
  return new Date(iso).toLocaleString(SAST_LOCALE, {
    timeZone: SAST,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
