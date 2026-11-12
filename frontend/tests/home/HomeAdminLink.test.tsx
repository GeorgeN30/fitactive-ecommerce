import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

const auth = vi.hoisted(() => ({ user: null as { role: string } | null }));
vi.mock("../../src/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../../src/hooks/useCatalog", () => ({ useCatalog: () => ({ products: [], loading: false, error: "" }) }));
vi.mock("../../src/components/AppLayout", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));

import HomePage from "../../src/pages/HomePage";

describe("home panel shortcuts", () => {
  afterEach(() => { auth.user = null; });

  it("does not show the administrator return button in the banner", () => {
    auth.user = { role: "admin" };
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Volver al panel admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Volver al panel de inventario" })).not.toBeInTheDocument();
  });

  it.each(["inventory", "receptionist"])("retains the inventory shortcut for %s", role => {
    auth.user = { role };
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Volver al panel de inventario" })).toHaveAttribute("href", "/inventory");
  });
});
