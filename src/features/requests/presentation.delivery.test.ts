import { describe, expect, it } from "vitest";
import { isDocumentDelivery, requestStatusLabel } from "@/features/requests/presentation";

const delivery = { request_type: "document_delivery" as const };

// 'new' on a delivery means the document is sitting with the client, not that
// nothing has happened — the default "New" badge would read as the opposite.
describe("document delivery status labels", () => {
  it("recognises a delivery", () => {
    expect(isDocumentDelivery(delivery)).toBe(true);
    expect(isDocumentDelivery({ request_type: "general" })).toBe(false);
  });

  it("tells the client the request is waiting on them", () => {
    expect(requestStatusLabel({ ...delivery, status: "new" }, "client")).toBe(
      "Awaiting your acknowledgement",
    );
  });

  it("words it impersonally for staff", () => {
    expect(requestStatusLabel({ ...delivery, status: "new" }, "staff")).toBe(
      "Awaiting acknowledgement",
    );
  });

  it("reads as acknowledged once closed", () => {
    expect(requestStatusLabel({ ...delivery, status: "completed" }, "client")).toBe("Acknowledged");
  });

  it("leaves other request types alone", () => {
    expect(requestStatusLabel({ request_type: "general", status: "new" }, "client")).toBeUndefined();
  });
});
