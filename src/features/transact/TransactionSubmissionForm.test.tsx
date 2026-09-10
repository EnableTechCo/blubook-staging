import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionSubmissionForm } from "@/features/transact/TransactionSubmissionForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/features/documents/directUploadActions", () => ({ prepareDirectDocumentUpload: vi.fn() }));
vi.mock("@/features/documents/directUpload", () => ({ uploadDocumentDirectly: vi.fn() }));
vi.mock("@/features/transact/submissionActions", () => ({ submitDocumentTransaction: vi.fn() }));
// The pipeline fields are a separate component with its own data needs; the
// form only mounts them, so a stub keeps this test about the form.
vi.mock("@/features/sales/OpportunityEditorDialog", () => ({
  OpportunityFields: () => <div data-testid="opportunity-fields" />,
}));

// What is covered here, and where the rest lives.
//
// These tests hold the form's branching: which fields each transaction kind
// asks for. They do not drive a submission, and no test in this repository
// does: the component submits through a React 19 `<form action={fn}>`, which
// this suite's jsdom does not invoke from fireEvent.submit, a click on the
// submit button, or userEvent.click. Every component test mocks its action
// module and asserts render, and this one follows that pattern.
//
// The submit orchestration — validate files, prepare and upload each with
// progress, build the per-kind payload, call the action — is not a gap. It
// lives in submitTransaction.ts with its collaborators as parameters, and
// submitTransaction.test.ts exercises it directly: ordering, progress by
// index, which error wins at each stage, and every payload shape.

const field = (name: string) => document.querySelector(`[name="${name}"]`);

afterEach(cleanup);

describe("TransactionSubmissionForm — what each kind asks for", () => {
  it("a purchase order asks for an order number and supplier, and never for an opportunity", () => {
    render(<TransactionSubmissionForm kind="purchase_order" />);
    expect(screen.getByLabelText(/purchase order number/i)).toBeInTheDocument();
    expect(field("supplier")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^opportunity$/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("opportunity-fields")).not.toBeInTheDocument();
  });

  it("a sales order asks for a sales order number and offers the existing opportunities", () => {
    render(
      <TransactionSubmissionForm
        kind="sales_order"
        opportunities={[{ id: "opp-1", opportunity_name: "Q3 catering", revenue: 12000 } as never]}
      />,
    );
    expect(screen.getByLabelText(/sales order number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^opportunity$/i)).toBeInTheDocument();
  });

  it("a tender asks for reference, title and issuing organisation instead of trade details", () => {
    render(<TransactionSubmissionForm kind="tender_submission" />);
    expect(screen.getByLabelText(/reference$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/issuing organisation/i)).toBeInTheDocument();
    expect(field("supplier")).toBeNull();
  });

  it("always offers a file input and a submit control, whatever the kind", () => {
    for (const kind of ["purchase_order", "sales_order", "tender_submission", "rffa", "rfq"] as const) {
      const { unmount } = render(<TransactionSubmissionForm kind={kind} />);
      expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
      unmount();
    }
  });
});
