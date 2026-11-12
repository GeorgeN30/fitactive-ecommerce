import { getPasswordRequirements } from "../utils/validation";

interface PasswordRequirementsProps {
  id?: string;
  password: string;
  visible: boolean;
}

export default function PasswordRequirements({
  id,
  password,
  visible,
}: PasswordRequirementsProps) {
  if (!visible) return null;

  const requirements = getPasswordRequirements(password);

  return (
    <div
      id={id}
      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/40 px-3 py-3 animate-fade-in"
      aria-live="polite"
    >
      <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Tu contraseña debe incluir:
      </p>
      <ul className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
        {requirements.map(({ id, label, met }) => (
          <li
            key={id}
            className={`flex items-start gap-2 text-sm leading-5 ${
              met ? "text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <i
              aria-hidden="true"
              className={`fa-solid ${
                met ? "fa-circle-check" : "fa-circle"
              } mt-1 shrink-0 text-xs`}
            />
            <span><span className="sr-only">{met ? "Cumplido: " : "Pendiente: "}</span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
