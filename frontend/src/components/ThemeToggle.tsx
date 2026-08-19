import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-[62px] h-[32px] rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-all duration-300 shrink-0 overflow-hidden"
      title={isDark ? "Modo oscuro (clic: claro)" : "Modo claro (clic: oscuro)"}
    >
      <span className="absolute left-[4px] z-10 flex items-center justify-center w-[24px] h-[24px]">
        <i className="fa-solid fa-sun text-[11px] text-amber-500" />
      </span>
      <span className="absolute right-[4px] z-10 flex items-center justify-center w-[24px] h-[24px]">
        <i className="fa-solid fa-moon text-[11px] text-slate-400" />
      </span>

      <span
        className={`absolute top-[3px] z-20 w-[26px] h-[26px] rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
          isDark ? "left-[33px] bg-slate-800" : "left-[3px] bg-white"
        }`}
      >
        {isDark ? (
          <i className="fa-solid fa-moon text-[10px] text-brand-green" />
        ) : (
          <i className="fa-solid fa-sun text-[10px] text-amber-500" />
        )}
      </span>
    </button>
  );
}
