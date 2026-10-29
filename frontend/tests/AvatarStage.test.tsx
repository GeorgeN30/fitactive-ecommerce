import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BodyScales } from "../src/components/ProbadorVirtual/Avatar3D";

const auth = vi.hoisted(() => ({ user: null as { id: string; bodyType: "slim" | "average" | "broad" | null } | null }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../src/components/ProbadorVirtual/Avatar3D", () => ({
  default: ({ scales, activeSize, customColor, cameraAction }: { scales: BodyScales; activeSize: string; customColor?: string; cameraAction?: { type: string } }) => <><output data-testid="body-scales">{JSON.stringify(scales)}</output><output data-testid="avatar-options">{JSON.stringify({ activeSize, customColor, cameraAction })}</output></>,
}));
import AvatarStage from "../src/components/ProbadorVirtual/AvatarStage";

beforeEach(() => { auth.user = null; localStorage.clear(); });

describe("avatar profile body type", () => {
  it.each(["Hombre", "Mujer"] as const)("reacts to the saved preference independently of garment size for %s", (gender) => {
    auth.user = { id: "u1", bodyType: "slim" };
    const props = { selectedProduct: null, genero: gender, activeSize: "M" };
    const { rerender } = render(<AvatarStage {...props} />);
    const slim = screen.getByTestId("body-scales").textContent;
    expect(JSON.parse(slim!).scalePecho).toBe(0.88);
    rerender(<AvatarStage {...props} activeSize="L" />);
    expect(screen.getByTestId("body-scales").textContent).toBe(slim);
    auth.user = { id: "u1", bodyType: "broad" };
    rerender(<AvatarStage {...props} />);
    expect(JSON.parse(screen.getByTestId("body-scales").textContent!).scalePecho).toBe(1.12);
    auth.user = { id: "u2", bodyType: null };
    rerender(<AvatarStage {...props} />);
    expect(JSON.parse(screen.getByTestId("body-scales").textContent!).scalePecho).toBe(1);
    auth.user = null;
    rerender(<AvatarStage {...props} />);
    expect(JSON.parse(screen.getByTestId("body-scales").textContent!).scalePecho).toBe(1);
  });

  it("keeps product information and garment selectors out of the viewport", async () => {
    const user = userEvent.setup();
    render(<AvatarStage selectedProduct={{ nombre: "Under Armour OutRun", tallas: [{ talla: "M", stock: 15 }] }} genero="Hombre" activeSize="M" customColor="#374151" />);
    expect(screen.queryByText("Prenda en prueba")).not.toBeInTheDocument();
    expect(screen.queryByText("Compatibilidad pendiente")).not.toBeInTheDocument();
    expect(screen.queryByText(/stock/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /talla|color/i })).not.toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId("avatar-options").textContent!).customColor).toBe("#374151");
    await user.click(screen.getByRole("button", { name: "Acercar cámara" }));
    expect(JSON.parse(screen.getByTestId("avatar-options").textContent!).cameraAction.type).toBe("zoom-in");
  });
});
