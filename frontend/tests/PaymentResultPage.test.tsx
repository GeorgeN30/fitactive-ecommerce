import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("../src/components/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../src/context/CartContext", () => ({
  useCart: vi.fn(),
}));
vi.mock("../src/services/orders", () => ({
  fetchMercadoPagoOrderStatus: vi.fn(),
  fetchMyOrders: vi.fn(),
}));

import PaymentResultPage from "../src/pages/PaymentResultPage";
import { useCart } from "../src/context/CartContext";
import { fetchMercadoPagoOrderStatus, fetchMyOrders } from "../src/services/orders";

const order = {
  id: "order-1",
  numero: "ORD-2026-TEST",
  total: 80,
  estado: "confirmed",
  fechaOrden: "2026-09-23T10:00:00.000Z",
  customerName: "Cliente",
  customerEmail: "cliente@test.com",
  customerPhone: "999999999",
  shippingAddress: "Av. Central 123",
  shippingDistrict: "Miraflores",
  shippingCity: "Lima",
  shippingReference: null,
  entries: [{
    productoTallaId: "size-m",
    nombre: "Polo real",
    talla: "M",
    cantidad: 1,
    precioUnitario: 80,
    subtotal: 80,
  }],
};

describe("PaymentResultPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCart).mockReturnValue({
      cartItems: [{ id: "product-1", name: "Polo", price: 80, img: "/polo.png", quantity: 1 }],
      cartTotal: 80,
      cartCount: 1,
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      registerPendingCheckout: vi.fn(),
      completePendingCheckout: vi.fn(),
    });
    vi.mocked(fetchMyOrders).mockResolvedValue([order]);
  });

  it("clears the cart only after the payment is approved and shows the receipt", async () => {
    vi.mocked(fetchMercadoPagoOrderStatus).mockResolvedValue({
      orderId: "order-1",
      orderNumber: "ORD-2026-TEST",
      orderStatus: "confirmed",
      paymentStatus: "approved",
      paymentStatusDetail: null,
      paymentId: "payment-1",
      preferenceId: "preference-1",
    });

    render(
      <MemoryRouter initialEntries={["/checkout/result?order_id=order-1&payment_id=payment-1"]}>
        <PaymentResultPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Pago aprobado")).toBeInTheDocument();
    expect(screen.getByText("Comprobante de compra")).toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(useCart).mock.results[0].value.completePendingCheckout).toHaveBeenCalledWith("order-1"));
  });

  it("keeps the cart when Mercado Pago leaves the order pending", async () => {
    vi.mocked(fetchMercadoPagoOrderStatus).mockResolvedValue({
      orderId: "order-1",
      orderNumber: "ORD-2026-TEST",
      orderStatus: "pending",
      paymentStatus: "pending",
      paymentStatusDetail: null,
      paymentId: null,
      preferenceId: "preference-1",
    });

    render(
      <MemoryRouter initialEntries={["/checkout/result?order_id=order-1"]}>
        <PaymentResultPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Pago pendiente")).toBeInTheDocument();
    expect(vi.mocked(useCart).mock.results[0].value.completePendingCheckout).not.toHaveBeenCalled();
  });

  it("clears stale cart data when the paid order already advanced to shipping", async () => {
    vi.mocked(fetchMercadoPagoOrderStatus).mockResolvedValue({
      orderId: "order-1",
      orderNumber: "ORD-2026-TEST",
      orderStatus: "shipped",
      paymentStatus: null,
      paymentStatusDetail: null,
      paymentId: "payment-1",
      preferenceId: "preference-1",
    });

    render(
      <MemoryRouter initialEntries={["/checkout/result?order_id=order-1&payment_id=payment-1"]}>
        <PaymentResultPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Pago aprobado")).toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(useCart).mock.results[0].value.completePendingCheckout).toHaveBeenCalledWith("order-1"));
  });
});
