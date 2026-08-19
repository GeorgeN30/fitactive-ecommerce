import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "../src/components/ThemeToggle";

let mockCurrentTheme = "light";
const mockSetTheme = vi.fn((newTheme: string) => {
  mockCurrentTheme = newTheme;
});

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockCurrentTheme,
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentTheme = "light";
  });

  it("renders sun icon in light mode", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button.querySelector(".fa-sun")).toBeInTheDocument();
  });

  it("renders moon icon in dark mode", () => {
    mockCurrentTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.querySelector(".fa-moon")).toBeInTheDocument();
  });

  it("calls setTheme with dark when clicked in light mode", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with light when clicked in dark mode", () => {
    mockCurrentTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("never calls setTheme with system", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockSetTheme).not.toHaveBeenCalledWith("system");
  });
});
