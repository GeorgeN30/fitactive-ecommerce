import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdminNotifications from "../../src/pages/admin/AdminNotifications";
function CurrentRoute() { const location = useLocation(); return <output>{location.pathname + location.search}</output>; }
describe("legacy admin notification entry", () => { it("routes to the live notification centre", () => {
  render(<MemoryRouter initialEntries={["/legacy-notifications"]}><AdminNotifications /><CurrentRoute /></MemoryRouter>);
  expect(screen.getByText("/admin?section=notifications")).toBeInTheDocument();
}); });
