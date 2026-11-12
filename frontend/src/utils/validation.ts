export const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
] as const;

export function getEmailValidationMessage(value: string): string | null {
  const email = value.trim();

  if (!email) return "Ingresa tu correo electrónico.";
  if (!email.includes("@")) return "Agrega @ en tu correo.";

  const [localPart, domain = ""] = email.split("@");
  if (!localPart) return "Escribe algo antes de @.";
  if (!domain) return "Completa el dominio después de @.";
  if (!domain.includes(".")) return "Agrega una extensión, por ejemplo .com.";

  const isValid =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(
      email,
    ) && !email.includes("..");

  if (!isValid) return "Revisa el formato, por ejemplo nombre@dominio.com.";

  return null;
}

export function getRegistrationEmailValidationMessage(value: string): string | null {
  const formatMessage = getEmailValidationMessage(value);
  if (formatMessage) return formatMessage;

  const domain = value.trim().slice(value.trim().lastIndexOf("@") + 1).toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  if (!PERSONAL_EMAIL_DOMAINS.includes(normalizedDomain as (typeof PERSONAL_EMAIL_DOMAINS)[number])) {
    return "Utiliza un correo personal de un proveedor admitido.";
  }

  return null;
}

export type PasswordRequirementId =
  | "length"
  | "uppercase"
  | "lowercase"
  | "number"
  | "special";

export const PASSWORD_REQUIREMENTS: ReadonlyArray<{
  id: PasswordRequirementId;
  label: string;
  test: (value: string) => boolean;
}> = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Una letra minúscula",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Un número",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "Un carácter especial",
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
];

export function getPasswordRequirements(value: string) {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(value),
  }));
}

export function isStrongPassword(value: string): boolean {
  return getPasswordRequirements(value).every((requirement) => requirement.met);
}
