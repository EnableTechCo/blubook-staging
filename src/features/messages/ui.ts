// Counterparties are anonymous to each other, so every message is attributed by
// role — never by name.
export const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  provider: "Provider",
  staff: "BluBook staff",
};

// Short, relative-ish stamp for inbox rows: time today, day+month otherwise.
export function inboxTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return sameDay
    ? date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// Full stamp inside a conversation.
export function messageTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
