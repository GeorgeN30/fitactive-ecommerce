import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PasswordRequirements from "../src/components/PasswordRequirements";

describe("PasswordRequirements", () => {
  it("preserves conditional visibility for other auth consumers", () => {
    const { rerender } = render(<PasswordRequirements password="" visible={false} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    rerender(<PasswordRequirements id="requirements" password="Strong123!" visible />);
    expect(document.getElementById("requirements")).toHaveAttribute("aria-live", "polite");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    for (const item of screen.getAllByRole("listitem")) {
      expect(item).toHaveTextContent("Cumplido:");
      expect(item).toHaveClass("text-sm", "text-emerald-700");
      expect(item.querySelector("i")).toHaveAttribute("aria-hidden", "true");
    }
  });
});
