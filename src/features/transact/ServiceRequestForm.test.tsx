import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceRequestForm, type ServiceOption } from "@/features/transact/ServiceRequestForm";

vi.mock("@/features/transact/actions", () => ({ submitServiceRequest: vi.fn() }));

afterEach(cleanup);

const service = (
  id: string,
  name: string,
  workGroup: string | null,
): ServiceOption => ({
  id,
  name,
  description: null,
  default_turnaround_days: null,
  service_groups: workGroup ? { name: workGroup } : null,
});

const groupLabels = () =>
  [...document.querySelectorAll("optgroup")].map((group) => group.getAttribute("label"));

// The picker is organised by work group so a client can see which team will
// pick the request up before raising it.
describe("ServiceRequestForm service picker", () => {
  it("groups services under the work group that delivers them", () => {
    render(
      <ServiceRequestForm
        services={[
          service("1", "Bookkeeping", "Finance Group"),
          service("2", "Recruitment", "HR Group"),
          service("3", "Payroll", "Finance Group"),
        ]}
      />,
    );

    expect(groupLabels()).toEqual(["Finance Group", "HR Group"]);
    const finance = document.querySelector('optgroup[label="Finance Group"]')!;
    expect(within(finance as HTMLElement).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Bookkeeping",
      "Payroll",
    ]);
  });

  it("puts services with no work group last, since they match any partner", () => {
    render(
      <ServiceRequestForm
        services={[service("1", "Ad hoc advice", null), service("2", "Bookkeeping", "Finance Group")]}
      />,
    );
    expect(groupLabels()).toEqual(["Finance Group", "Other services"]);
  });

  it("still lets a service be chosen by name", () => {
    render(<ServiceRequestForm services={[service("1", "Bookkeeping", "Finance Group")]} />);
    expect(screen.getByRole("option", { name: "Bookkeeping" })).toBeInTheDocument();
  });
});
