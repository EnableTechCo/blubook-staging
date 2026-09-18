import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/onboarding/actions", () => ({
  createClientAccount: vi.fn(async () => undefined),
}));

import { ClientSignUpWizard } from "@/features/onboarding/OnboardClientWizard";

// The wizard's navigation is ordinary buttons, so it can be driven here. The
// final submission goes through a React 19 form action, which this suite
// cannot invoke; the action's own parsing is tested in intakeStages.test.ts
// and the server-side signup step tests.

const packages = [
  {
    id: "pkg-1",
    name: "Foundation",
    tier: "basic",
    price: 1000,
    items: [
      { id: "li-fin", name: "Bookkeeping", tier: "basic", price: 500, workGroupSlug: "finance" },
      { id: "li-ops", name: "Sales desk", tier: "basic", price: 500, workGroupSlug: "sales-operations" },
    ],
  },
];

const lineItems = [
  {
    id: "li-tender",
    name: "Bid review",
    tier: "professional",
    price: 900,
    serviceName: "Tender readiness",
    workGroupName: "Tender Services",
    workGroupSlug: "tender-services",
  },
];

const workGroups = [
  { slug: "capital", name: "Capital" },
  { slug: "finance", name: "Finance" },
  { slug: "tender-services", name: "Tender Services" },
];

const rail = () => screen.getByRole("navigation", { name: "Account setup stages" });
const railButton = (name: string | RegExp) => within(rail()).getByRole("button", { name });
const heading = () => screen.getByRole("heading", { level: 2 });

function fillBusiness() {
  fireEvent.change(screen.getByLabelText("Registered company name"), { target: { value: "Ridge Foods" } });
  fireEvent.change(screen.getByLabelText("Entity type"), { target: { value: "sole_proprietor" } });
  fireEvent.change(screen.getByLabelText("Industry"), { target: { value: "Hospitality" } });
}

afterEach(cleanup);

describe("ClientSignUpWizard", () => {
  it("opens on the business stage and lists every stage, marking groups the package does not draw on", () => {
    render(<ClientSignUpWizard packages={packages} lineItems={lineItems} workGroups={workGroups} />);

    expect(heading()).toHaveTextContent("Business details");
    expect(screen.getByText("Stage 1 of 7")).toBeInTheDocument();

    // Finance is in the package; Capital and Tender Services are not, yet.
    expect(railButton(/Finance/)).toHaveTextContent("Work group intake");
    expect(railButton(/Capital/)).toHaveTextContent("Not in this package");
    expect(railButton(/Tender Services/)).toHaveTextContent("Not in this package");
    expect(railButton(/Capital/)).toBeDisabled();
  });

  it("will not leave a stage with a required field empty, and moves on once it is filled", () => {
    render(<ClientSignUpWizard packages={packages} lineItems={lineItems} workGroups={workGroups} />);

    fireEvent.click(screen.getByRole("button", { name: "Next: Contacts and login" }));
    expect(heading()).toHaveTextContent("Business details");

    fillBusiness();
    fireEvent.click(screen.getByRole("button", { name: "Next: Contacts and login" }));
    expect(heading()).toHaveTextContent("Contacts and login");
    expect(screen.getByText("Stage 2 of 7")).toBeInTheDocument();

    // Back is free, and a visited stage can be reopened from the rail.
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(heading()).toHaveTextContent("Business details");
    fireEvent.click(railButton(/Contacts/));
    expect(heading()).toHaveTextContent("Contacts and login");
  }, 10_000);

  it("adds a work group's stage when a line item from that group joins the package", () => {
    render(<ClientSignUpWizard packages={packages} lineItems={lineItems} workGroups={workGroups} />);

    // The package stage is mounted but hidden until it is reached, which is
    // the point: one FormData carries every stage. Queries opt in to hidden.
    fireEvent.change(screen.getByLabelText("Add a line item"), { target: { value: "li-tender" } });
    fireEvent.click(screen.getByRole("button", { name: "Add item", hidden: true }));

    expect(railButton(/Tender Services/)).toHaveTextContent("Work group intake");
    expect(screen.getByText("Stage 1 of 8")).toBeInTheDocument();
    expect(screen.getByText(/Finance, Tender Services\. Each has a short stage/)).toBeInTheDocument();
  });

  it("asks for the compliance manager on the contacts stage, optional until a name is given", () => {
    render(<ClientSignUpWizard packages={packages} lineItems={lineItems} workGroups={workGroups} />);

    const name = screen.getByLabelText(/Compliance manager name/);
    const email = screen.getByLabelText(/Compliance manager email/);
    expect(name).toHaveAttribute("name", "complianceManagerName");
    expect(email).toHaveAttribute("name", "complianceManagerEmail");
    expect(name).not.toBeRequired();
    expect(email).not.toBeRequired();

    // A name without an email is a contact nothing can reach.
    fireEvent.change(name, { target: { value: "Thabo Nkosi" } });
    expect(email).toBeRequired();

    // "Same as primary contact" copies the primary contact across.
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Naledi Dlamini" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "naledi@ridge.test" } });
    fireEvent.click(screen.getAllByLabelText("Same as primary contact")[1]);
    expect(name).toHaveValue("Naledi Dlamini");
    expect(email).toHaveValue("naledi@ridge.test");
  });

  it("renders a work group's questions from the specification, with required ones enforced", () => {
    render(<ClientSignUpWizard packages={packages} lineItems={lineItems} workGroups={workGroups} />);

    const financeSelect = screen.getByLabelText("Accounting system in use");
    expect(financeSelect).toHaveAttribute("name", "intake[finance][accounting_system]");
    expect(financeSelect).toBeRequired();
    expect(screen.getByLabelText(/Primary bank/)).not.toBeRequired();
    expect(within(financeSelect).getByRole("option", { name: "GreatSoft", hidden: true })).toBeInTheDocument();

    // No stage is rendered for a group the package does not touch, so nothing
    // for it can be posted.
    expect(screen.queryByLabelText(/B-BBEE status/)).toBeNull();
  });

  it("offers the submit button only on the review stage, and no summary before it is opened", () => {
    render(<ClientSignUpWizard packages={packages} lineItems={lineItems} workGroups={workGroups} />);
    expect(screen.queryByRole("button", { name: "Create my account" })).toBeNull();
    expect(screen.getByRole("button", { name: "Next: Contacts and login" })).toBeInTheDocument();
    expect(screen.queryByText("Service package", { selector: "h3" })).toBeNull();
  });
});
