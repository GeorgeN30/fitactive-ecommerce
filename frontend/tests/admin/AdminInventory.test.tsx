import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdminInventory from "../../src/pages/admin/AdminInventory";
function CurrentRoute() { const location = useLocation(); return <output>{location.pathname + location.search}</output>; }
describe("legacy admin inventory entry", () => { it("routes to the live inventory dashboard", () => {
  render(<MemoryRouter initialEntries={["/legacy-inventory"]}><AdminInventory /><CurrentRoute /></MemoryRouter>);
  expect(screen.getByText("/inventory?section=catalog")).toBeInTheDocument();
}); });
