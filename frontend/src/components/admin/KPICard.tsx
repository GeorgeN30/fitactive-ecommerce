interface KPICardProps {
  title: string;
  value: string;
  growth?: number;
  icon: string;
  growthLabel?: string;
  onClick?: () => void;
}

export default function KPICard({ title, value, growth, icon, growthLabel = "este mes", onClick }: KPICardProps) {
  return (
    <div
      className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group transition-all ${
        onClick ? "hover:shadow-md cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">{title}</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold">
          <i className={`fa-solid ${icon} text-sm`} />
        </div>
      </div>
      {growth !== undefined && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-brand-green font-bold text-xs">
            <i className={`fa-solid fa-arrow-trend-${growth >= 0 ? "up" : "down"} text-[10px]`} />
            <span>{growth >= 0 ? "+" : ""}{growth}%</span>
            <span className="text-slate-400 font-normal ml-0.5">{growthLabel}</span>
          </div>
          <svg className="w-16 h-6 text-brand-green/60" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path
              d={growth >= 0 ? "M0 25 L20 22 L40 24 L60 15 L80 18 L100 5" : "M0 5 L20 8 L40 6 L60 15 L80 12 L100 25"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
