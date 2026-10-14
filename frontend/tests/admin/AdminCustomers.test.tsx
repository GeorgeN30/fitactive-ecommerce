import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdminCustomers from "../../src/pages/admin/AdminCustomers";
function CurrentRoute() { return <output>{useLocation().pathname + useLocation().search}</output>; }
describe("legacy customers entry", () => { it("redirects to the live database-backed admin customer section", () => {
  render(<MemoryRouter initialEntries={["/admin/customers-old"]}><AdminCustomers /><CurrentRoute /></MemoryRouter>);
  expect(screen.getByText("/admin?section=clients")).toBeInTheDocument();
}); });
