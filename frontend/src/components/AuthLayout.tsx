import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

function DarkPanel() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center px-10">
      <Link to="/" className="mb-8">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          FIT<span className="text-brand-green">LOOK</span>
        </span>
        <span className="block bg-brand-input-dark text-[10px] font-bold text-brand-green px-3 py-1 rounded border border-brand-input-border-dark tracking-wider mt-2 w-fit mx-auto">
          AR FIT
        </span>
      </Link>
      <h2 className="text-3xl 2xl:text-4xl font-extrabold text-white mb-4">
        Bienvenido de vuelta
      </h2>
      <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
        Inicia sesión para acceder a tu armario virtual, sincroniza tus
        medidas AR y gestionar tus pedidos.
      </p>
      <div className="mt-10 grid grid-cols-3 gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <i className="fa-solid fa-cube text-brand-green text-lg" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Probador 2D
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <i className="fa-solid fa-ruler-vertical text-brand-green text-lg" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Medidas AR
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <i className="fa-solid fa-truck-fast text-brand-green text-lg" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Envío rápido
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-light-bg dark:bg-brand-dark-bg flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-brand-dark-bg flex-col justify-between p-10 2xl:p-14">
        <div className="flex items-start justify-start">
          <ThemeToggle />
        </div>
        <DarkPanel />
        <div className="text-[10px] text-slate-600">
          &copy; 2026 FITLOOK Athletics
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-[45%] bg-white dark:bg-brand-card-dark flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute top-5 right-5 lg:hidden">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}