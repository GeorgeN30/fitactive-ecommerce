import { getPasswordRequirements } from "../utils/validation";

interface PasswordRequirementsProps {
  password: string;
  visible: boolean;
}

export default function PasswordRequirements({
  password,
  visible,
}: PasswordRequirementsProps) {
  if (!visible) return null;

  const requirements = getPasswordRequirements(password);

  return (
    <div
      className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 px-3 py-2.5 animate-fade-in"
      aria-live="polite"
    >
      <p className="mb-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        Tu contraseña debe incluir:
      </p>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {requirements.map(({ id, label, met }) => (
          <li
            key={id}
            className={`flex items-center gap-1.5 text-[11px] ${
              met ? "text-brand-green" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <i
              className={`fa-solid ${
                met ? "fa-circle-check" : "fa-circle"
              } text-[9px]`}
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
