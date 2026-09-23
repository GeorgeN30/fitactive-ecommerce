import { describe, expect, it } from "vitest";
import {
  getEmailValidationMessage,
  getPasswordRequirements,
  isStrongPassword,
} from "../src/utils/validation";

describe("form validation helpers", () => {
  it("explains the missing parts of an email while it is being typed", () => {
    expect(getEmailValidationMessage("usuario")).toBe("Agrega @ en tu correo.");
    expect(getEmailValidationMessage("usuario@")).toBe(
      "Completa el dominio después de @.",
    );
    expect(getEmailValidationMessage("usuario@dominio")).toBe(
      "Agrega una extensión, por ejemplo .com.",
    );
    expect(getEmailValidationMessage("usuario@dominio.com")).toBeNull();
  });

  it("checks all registration password requirements", () => {
    const requirements = getPasswordRequirements("Abcdefg1!");

    expect(requirements.every((requirement) => requirement.met)).toBe(true);
    expect(isStrongPassword("Abcdefg1!")).toBe(true);
    expect(isStrongPassword("password123")).toBe(false);
  });
});
