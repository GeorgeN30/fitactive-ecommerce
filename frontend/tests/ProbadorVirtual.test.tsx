import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("../src/components/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../src/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import ProbadorVirtual, { paginateProducts, PRODUCTS_PER_PAGE } from "../src/pages/ProbadorVirtual";
import api from "../src/services/api";

interface TestProduct {
  id: string;
  nombre: string;
  genero: string;
  categoria: string;
  producto_tallas: [];
  imagenUrl: string;
}

function createProducts(count: number): TestProduct[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `product-${index + 1}`,
    nombre: `Prenda ${index + 1}`,
    genero: "Hombre",
    categoria: "Running",
    producto_tallas: [],
    imagenUrl: `https://example.com/product-${index + 1}.jpg`,
  }));
}

describe("ProbadorVirtual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("paginates product collections in groups of five", () => {
    const products = Array.from({ length: 30 }, (_, index) => index + 1);

    expect(PRODUCTS_PER_PAGE).toBe(5);
    expect(paginateProducts(products, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(paginateProducts(products, 6)).toEqual([26, 27, 28, 29, 30]);
    expect(paginateProducts(products, 0)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows five garments and lets the user move to the next page", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: createProducts(30) } as never);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProbadorVirtual />
      </MemoryRouter>,
    );

    const selector = await screen.findByRole("group", { name: "Selector de prendas" });
    expect(within(selector).getByAltText("Prenda 1")).toBeInTheDocument();
    expect(within(selector).getByAltText("Prenda 5")).toBeInTheDocument();
    expect(within(selector).getByAltText("Prenda 1").getAttribute("src")).toBe("https://example.com/product-1.jpg");
    expect(within(selector).queryByAltText("Prenda 6")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 1-5 de 30 prendas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Prendas siguientes" }));

    expect(within(selector).getByAltText("Prenda 6")).toBeInTheDocument();
    expect(within(selector).getByAltText("Prenda 10")).toBeInTheDocument();
    expect(within(selector).queryByAltText("Prenda 5")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 6-10 de 30 prendas")).toBeInTheDocument();
  });
});
