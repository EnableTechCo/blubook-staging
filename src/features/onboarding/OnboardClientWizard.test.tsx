import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/onboarding/actions", () => ({
  completeOnboarding: vi.fn(async () => undefined),
}));

import { OnboardClientWizard } from "@/features/onboarding/OnboardClientWizard";

// The wizard's navigation is ordinary buttons, so it can be driven here. The
// final submission goes through a React 19 form action, which this suite
// cannot invoke; the action's own parsing is tested in intakeStages.test.ts
// and onboardClientSteps.test.ts.

const packages = [
  {
    id: "pkg-1",
    name: "Foundation",
    tier: "basic",
    items: [
      { id: "li-fin", name: "Bookkeeping", tier: "basic", workGroupSlug: "finance" },
      { id: "li-ops", name: "Sales desk", tier: "basic", workGroupSlug: "sales-operations" },
    ],
  },
];

const lineItems = [
  {
    id: "li-tender",
    name: "Bid review",
    tier: "professional",
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

// The invited client's link: 43 base64url characters, and the address it was sent to.
const invitation = { token: "a".repeat(43), email: "naledi@ridge.test" };
const renderWizard = () =>
  render(<OnboardClientWizard packages={packages} lineItems={lineItems} workGroups={workGroups} invitation={invitation} />);

const rail = () => screen.getByRole("navigation", { name: "Onboarding stages" });
const railButton = (name: string | RegExp) => within(rail()).getByRole("button", { name });
const heading = () => screen.getByRole("heading", { level: 2 });

function fillBusiness() {
  fireEvent.change(screen.getByLabelText("Registered company name"), { target: { value: "Ridge Foods" } });
  fireEvent.change(screen.getByLabelText("Entity type"), { target: { value: "sole_proprietor" } });
  fireEvent.change(screen.getByLabelText("Industry"), { target: { value: "Hospitality" } });
}

afterEach(cleanup);

describe("OnboardClientWizard", () => {
  it("opens on the business stage and lists every stage, marking groups the package does not draw on", () => {
    renderWizard();

    expect(heading()).toHaveTextContent("Business details");
    expect(screen.getByText("Stage 1 of 7")).toBeInTheDocument();

    // Finance is in the package; Capital and Tender Services are not, yet.
    expect(railButton(/Finance/)).toHaveTextContent("Work group intake");
    expect(railButton(/Capital/)).toHaveTextContent("Not in this package");
    expect(railButton(/Tender Services/)).toHaveTextContent("Not in this package");
    expect(railButton(/Capital/)).toBeDisabled();
  });

  it("will not leave a stage with a required field empty, and moves on once it is filled", () => {
    renderWizard();

    fireEvent.click(screen.getByRole("button", { name: "Next: Contacts and password" }));
    expect(heading()).toHaveTextContent("Business details");

    fillBusiness();
    fireEvent.click(screen.getByRole("button", { name: "Next: Contacts and password" }));
    expect(heading()).toHaveTextContent("Contacts");
    expect(screen.getByText("Stage 2 of 7")).toBeInTheDocument();

    // Back is free, and a visited stage can be reopened from the rail.
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(heading()).toHaveTextContent("Business details");
    fireEvent.click(railButton(/Contacts/));
    expect(heading()).toHaveTextContent("Contacts");
  });

  it("adds a work group's stage when a line item from that group joins the package", () => {
    renderWizard();

    // The package stage is mounted but hidden until it is reached, which is
    // the point: one FormData carries every stage. Queries opt in to hidden.
    fireEvent.change(screen.getByLabelText("Add a line item"), { target: { value: "li-tender" } });
    fireEvent.click(screen.getByRole("button", { name: "Add item", hidden: true }));

    expect(railButton(/Tender Services/)).toHaveTextContent("Work group intake");
    expect(screen.getByText("Stage 1 of 8")).toBeInTheDocument();
    expect(screen.getByText(/Finance, Tender Services\. Each has a short stage/)).toBeInTheDocument();
  });

  it("asks for the compliance manager on the contacts stage, optional until a name is given", () => {
    renderWizard();

    const name = screen.getByLabelText(/Compliance manager name/);
    const email = screen.getByLabelText(/Compliance manager email/);
    expect(name).toHaveAttribute("name", "complianceManagerName");
    expect(email).toHaveAttribute("name", "complianceManagerEmail");
    expect(name).not.toBeRequired();
    expect(email).not.toBeRequired();

    // A name without an email is a contact nothing can reach.
    fireEvent.change(name, { target: { value: "Thabo Nkosi" } });
    expect(email).toBeRequired();

    // "Same as primary contact" copies the primary contact across, including
    // the invited address.
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Naledi Dlamini" } });
    fireEvent.click(screen.getAllByLabelText("Same as primary contact")[1]);
    expect(name).toHaveValue("Naledi Dlamini");
    expect(email).toHaveValue("naledi@ridge.test");
  });

  it("renders a work group's questions from the specification, with required ones enforced", () => {
    renderWizard();

    const financeSelect = screen.getByLabelText("Accounting system in use");
    expect(financeSelect).toHaveAttribute("name", "intake[finance][accounting_system]");
    expect(financeSelect).toBeRequired();
    expect(screen.getByLabelText(/Primary bank/)).not.toBeRequired();
    expect(within(financeSelect).getByRole("option", { name: "GreatSoft", hidden: true })).toBeInTheDocument();

    // No stage is rendered for a group the package does not touch, so nothing
    // for it can be posted.
    expect(screen.queryByLabelText(/B-BBEE status/)).toBeNull();
  });

  it("fixes the login to the invited address, asks for a password, and carries the token", () => {
    const { container } = renderWizard();

    const email = screen.getByLabelText("Email");
    expect(email).toHaveValue("naledi@ridge.test");
    expect(email).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Password")).toHaveAttribute("name", "password");
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(container.querySelector('input[name="invitationToken"]')).toHaveValue("a".repeat(43));
    // No temporary password any more: the client chooses their own.
    expect(container.querySelector('input[name="tempPassword"]')).toBeNull();
  });

  it("offers the submit button only on the review stage, and no summary before it is opened", () => {
    renderWizard();
    expect(screen.queryByRole("button", { name: "Submit for approval" })).toBeNull();
    expect(screen.getByRole("button", { name: "Next: Contacts and password" })).toBeInTheDocument();
    expect(screen.queryByText("Service package", { selector: "h3" })).toBeNull();
  });
});
