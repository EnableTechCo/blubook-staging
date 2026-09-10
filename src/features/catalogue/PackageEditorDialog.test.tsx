import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PackageEditorDialog, type EditorLineItem } from "@/features/catalogue/PackageEditorDialog";
import { toPackageSlug } from "@/lib/validation/catalogue";

const mocks = vi.hoisted(() => ({ savePackage: vi.fn(), createLineItem: vi.fn() }));
vi.mock("@/features/catalogue/actions", () => ({
  savePackage: mocks.savePackage,
  createLineItem: mocks.createLineItem,
}));

// jsdom has no <dialog> implementation. The component drives open/close through
// showModal()/close() and reads back `dialog.open`, so both are stubbed to
// toggle the attribute exactly as a browser would.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

const items: EditorLineItem[] = [
  { id: "li-1", name: "Bookkeeping", tier: "basic", price: 500, serviceName: "Finance", fulfilmentMode: "service_request" },
  { id: "li-2", name: "Payroll", tier: "intermediate", price: 900, serviceName: "Finance", fulfilmentMode: "service_request" },
];
const services = [{ id: "svc-1", name: "Finance" }];

const open = () => fireEvent.click(screen.getByRole("button", { name: /new package|edit/i }));
const hidden = (name: string) => document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`);

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("PackageEditorDialog", () => {
  it("renders only its trigger until opened", () => {
    render(<PackageEditorDialog lineItems={items} services={services} trigger={{ label: "New package" }} />);
    expect(screen.getByRole("button", { name: "New package" })).toBeInTheDocument();
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });

  it("derives the slug from the name while creating, until the slug is edited by hand", () => {
    render(<PackageEditorDialog lineItems={items} services={services} trigger={{ label: "New package" }} />);
    open();

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "Growth Bundle 2026" } });
    expect(hidden("slug")?.value).toBe(toPackageSlug("Growth Bundle 2026"));

    // Once touched, renaming no longer rewrites it — a live package's slug must not drift.
    fireEvent.change(screen.getByLabelText(/slug/i), { target: { value: "custom-slug" } });
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "Renamed Again" } });
    expect(hidden("slug")?.value).toBe("custom-slug");
  });

  it("pre-ticks the package's existing line items when editing, and posts them as JSON", () => {
    render(
      <PackageEditorDialog
        lineItems={items}
        services={services}
        trigger={{ label: "Edit" }}
        editing={{ id: "pkg-1", name: "Starter", slug: "starter", tier: "basic", price: 1200,
          description: null, billing_interval: "monthly", lineItemIds: ["li-2"] }}
      />,
    );
    open();

    const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.map((b) => b.checked)).toEqual([false, true]);
    expect(JSON.parse(hidden("lineItemIds")!.value)).toEqual(["li-2"]);
    expect(hidden("packageId")?.value).toBe("pkg-1");
    // Editing does not re-derive the slug from the name.
    expect(hidden("slug")?.value).toBe("starter");
  });

  it("toggling a line item updates the posted selection", () => {
    render(<PackageEditorDialog lineItems={items} services={services} trigger={{ label: "New package" }} />);
    open();

    const [first, second] = screen.getAllByRole("checkbox");
    fireEvent.click(first);
    fireEvent.click(second);
    expect(JSON.parse(hidden("lineItemIds")!.value)).toEqual(["li-1", "li-2"]);
    fireEvent.click(first);
    expect(JSON.parse(hidden("lineItemIds")!.value)).toEqual(["li-2"]);
  });

  it("creates a line item inline and makes it tickable without reopening", async () => {
    mocks.createLineItem.mockResolvedValue({ lineItem: { id: "li-new", name: "Tax filing" } });
    render(<PackageEditorDialog lineItems={items} services={services} trigger={{ label: "New package" }} />);
    open();

    // The inline creator is collapsed behind its own button.
    fireEvent.click(screen.getByRole("button", { name: "+ Add line item" }));
    fireEvent.change(screen.getByLabelText(/^name/i, { selector: "#newItemName" }), { target: { value: "Tax filing" } });
    fireEvent.change(screen.getByLabelText(/price/i, { selector: "#newItemPrice" }), { target: { value: "350" } });
    // Exact name: "+ Add line item" opens the creator, "Add line item" confirms
    // it, and "Save package" is the outer form — a loose regex hit the wrong one.
    fireEvent.click(screen.getByRole("button", { name: "Add line item" }));

    await waitFor(() => expect(mocks.createLineItem).toHaveBeenCalledTimes(1));
    const posted = mocks.createLineItem.mock.calls[0][1] as FormData;
    expect(posted.get("name")).toBe("Tax filing");
    expect(posted.get("price")).toBe("350");
    expect(posted.get("serviceId")).toBe("svc-1");

    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(3));
  });

  it("surfaces the action's error when inline creation is refused", async () => {
    mocks.createLineItem.mockResolvedValue({ error: "A line item with that name exists." });
    render(<PackageEditorDialog lineItems={items} services={services} trigger={{ label: "New package" }} />);
    open();

    fireEvent.click(screen.getByRole("button", { name: "+ Add line item" }));
    fireEvent.change(screen.getByLabelText(/^name/i, { selector: "#newItemName" }), { target: { value: "Bookkeeping" } });
    fireEvent.change(screen.getByLabelText(/price/i, { selector: "#newItemPrice" }), { target: { value: "1" } });
    // Exact name: "+ Add line item" opens the creator, "Add line item" confirms
    // it, and "Save package" is the outer form — a loose regex hit the wrong one.
    fireEvent.click(screen.getByRole("button", { name: "Add line item" }));

    expect(await screen.findByText("A line item with that name exists.")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });
});
