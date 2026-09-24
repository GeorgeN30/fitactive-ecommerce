import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalModal } from "../src/components/AuthLayout";

describe("LegalModal", () => {
  it("keeps the legal document centered with its own responsive scroll area", () => {
    render(<LegalModal doc="terms" onClose={vi.fn()} onSwitch={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    const panel = document.getElementById("legal-modal-print");
    const content = panel?.querySelector(".overflow-y-auto");

    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.className).toContain("place-items-center");
    expect(panel?.className).toContain("calc(100dvh-1rem)");
    expect(panel?.className).toContain("min-h-0");
    expect(content?.className).toContain("flex-1");
    expect(content?.className).toContain("overflow-y-auto");
  });
});
