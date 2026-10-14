import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdminProducts from "../../src/pages/admin/AdminProducts";
function CurrentRoute() { const location = useLocation(); return <output>{location.pathname + location.search}</output>; }
describe("legacy admin products entry", () => { it("routes to the API-backed product manager", () => {
  render(<MemoryRouter initialEntries={["/legacy-products"]}><AdminProducts /><CurrentRoute /></MemoryRouter>);
  expect(screen.getByText("/admin?section=products")).toBeInTheDocument();
}); });
