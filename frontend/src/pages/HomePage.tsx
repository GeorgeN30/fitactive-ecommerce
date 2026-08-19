import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

const categories = [
  {
    title: "Hombres",
    desc: "Polos, shorts, pantalones, sudaderas y casacas deportivas.",
    icon: "fa-solid fa-shirt",
    color: "brand-green",
    bg: "bg-brand-green/10",
  },
  {
    title: "Mujeres",
    desc: "Leggings, tops, shorts, polos y casacas deportivas.",
    icon: "fa-solid fa-vest",
    color: "pink-500",
    bg: "bg-pink-500/10",
  },
  {
    title: "Probador Virtual",
    desc: "Prueba prendas virtualmente con tu medida personalizada.",
    icon: "fa-solid fa-cube",
    color: "violet-500",
    bg: "bg-violet-500/10",
  },
  {
    title: "Nuevo Ingreso",
    desc: "Descubre las ultimas colecciones que acabamos de agregar.",
    icon: "fa-solid fa-sparkles",
    color: "amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Ofertas",
    desc: "Aprovecha descuentos exclusivos en prendas seleccionadas.",
    icon: "fa-solid fa-tag",
    color: "red-500",
    bg: "bg-red-500/10",
  },
  {
    title: "Favoritos",
    desc: "Tus prendas favoritas guardadas para despues.",
    icon: "fa-regular fa-heart",
    color: "rose-500",
    bg: "bg-rose-500/10",
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Catalogo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bienvenido{user?.name ? `, ${user.name}` : ""}. Explora nuestra
            coleccion de ropa deportiva.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="bg-white rounded-2xl border border-slate-100 dark:bg-brand-card-dark dark:border-slate-700/50 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div
                className={`w-12 h-12 ${cat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <i className={`${cat.icon} text-${cat.color} text-lg`} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {cat.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-brand-card-dark rounded-3xl p-8 sm:p-10 text-white">
          <div className="max-w-lg">
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">
              Probador AR
            </span>
            <h2 className="text-2xl font-extrabold mt-2 mb-3">
              Prueba cualquier prenda{" "}
              <span className="text-brand-green">virtualmente</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Nuestra tecnologia de realidad aumentada te permite ver como te
              queda cada prenda antes de comprarla. Sin sorpresas.
            </p>
            <button className="bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-brand-green/20">
              Explorar catalogo
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
