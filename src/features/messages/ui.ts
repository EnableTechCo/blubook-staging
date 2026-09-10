// Counterparties are anonymous to each other, so every message is attributed by
// role — never by name.
export const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  provider: "Provider",
  staff: "BluBook staff",
};

// Short, relative-ish stamp for inbox rows: time today, day+month otherwise.
// "Today" is the South African day, not the host's — otherwise a message sent

