import AppLayout from "../components/AppLayout";

const stats = [
  {
    label: "Productos",
    value: "0",
    icon: "fa-solid fa-shirt",
    color: "brand-green",
    bg: "bg-brand-green/10",
  },
  {
    label: "Pedidos",
    value: "0",
    icon: "fa-solid fa-bag-shopping",
    color: "violet-500",
    bg: "bg-violet-500/10",
  },
  {
    label: "Usuarios",
    value: "0",
    icon: "fa-solid fa-users",
    color: "blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Ingresos",
    value: "$0",
    icon: "fa-solid fa-dollar-sign",
    color: "amber-500",
    bg: "bg-amber-500/10",
  },
];

const actions = [
  {
    title: "Catalogo",
    desc: "Agrega, edita y elimina productos del catalogo.",
    icon: "fa-solid fa-tags",
    color: "brand-green",
    bg: "bg-brand-green/10",
  },
  {
    title: "Pedidos",
    desc: "Revisa y gestiona los pedidos de los clientes.",
    icon: "fa-solid fa-clipboard-list",
    color: "violet-500",
    bg: "bg-violet-500/10",
  },
  {
    title: "Promociones",
    desc: "Crea cupones y gestiona ofertas especiales.",
    icon: "fa-solid fa-percent",
    color: "amber-500",
    bg: "bg-amber-500/10",
  },
];

export default function AdminPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Panel de Administracion
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestiona productos, pedidos y usuarios.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-100 dark:bg-brand-card-dark dark:border-slate-700/50 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}
                >
                  <i className={`${stat.icon} text-${stat.color} text-sm`} />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {actions.map((action) => (
            <div
              key={action.title}
              className="bg-white rounded-2xl border border-slate-100 dark:bg-brand-card-dark dark:border-slate-700/50 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div
                className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <i className={`${action.icon} text-${action.color} text-lg`} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {action.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {action.desc}
              </p>
              <span className="text-xs font-semibold text-brand-green group-hover:underline">
                Gestionar
                <i className="fa-solid fa-arrow-right ml-1 text-[10px]" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
