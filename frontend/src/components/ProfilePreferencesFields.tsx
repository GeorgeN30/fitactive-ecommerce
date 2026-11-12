export interface ProfilePreferences {
  preferencia_deporte: string;
  preferencia_ropa: string;
  preferencia_colores: string;
}

const fields = [
  { key: "preferencia_deporte", label: "Deporte / Disciplina", options: [
    ["Running", "Running / Correr"], ["Gym", "Gym / Fitness / Crossfit"],
    ["Yoga", "Yoga / Pilates"], ["Casual", "Casual / Lifestyle"],
  ] },
  { key: "preferencia_ropa", label: "Corte de prenda habitual", options: [
    ["Regular", "Regular Fit (Estándar)"], ["Ajustado", "Slim Fit (Compresión / Atlético)"],
    ["Oversize", "Oversize (Holgado)"],
  ] },
  { key: "preferencia_colores", label: "Gama de color preferida", options: [
    ["Oscuros", "Tonos Oscuros (Negro, Azul marino, Grafito)"],
    ["Claros", "Tonos Claros (Blanco, Gris perla, Beige)"],
    ["Vibrantes", "Colores Deportivos (Rojo, Azul royal, Neón)"],
  ] },
] as const;

export default function ProfilePreferencesFields({ values, onChange, disabled = false }: {
  values: ProfilePreferences;
  onChange: (values: ProfilePreferences) => void;
  disabled?: boolean;
}) {
  return fields.map(({ key, label, options }) => (
    <div key={key}>
      <label htmlFor={`profile-${key}`} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <select
        id={`profile-${key}`}
        value={values[key]}
        onChange={(event) => onChange({ ...values, [key]: event.target.value })}
        disabled={disabled}
        className="w-full min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-green"
      >
        <option value="">Sin preferencia</option>
        {values[key] && !options.some(([value]) => value === values[key]) && (
          <option value={values[key]}>{values[key]}</option>
        )}
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  ));
}
