import { Link } from "react-router-dom";
import { useStoreSettings } from "../context/StoreSettingsContext";
const groups = [
  { title: "Tienda", links: [["Hombre", "/catalogo?genero=Hombre"], ["Mujer", "/catalogo?genero=Mujer"], ["Catálogo", "/catalogo"], ["Ofertas", "/catalogo?ofertas=1"], ["Probador AR", "/probador-virtual"]] },
  { title: "Soporte", links: [["Envíos", "/soporte/envios"], ["Devoluciones", "/soporte/devoluciones"], ["Guía de tallas", "/soporte/tallas"], ["Contacto", "/soporte/contacto"], ["Preguntas frecuentes", "/soporte/faq"]] },
  { title: "Legal", links: [["Términos de servicio", "/legal/terminos"], ["Privacidad", "/legal/privacidad"], ["Cookies y almacenamiento", "/legal/cookies"], ["Acerca del probador", "/soporte/probador"]] },
];
export default function Footer() {
  const settings = useStoreSettings();
  return <footer className="bg-brand-dark-bg text-slate-400 pt-16 pb-10 border-t border-slate-800"><div className="max-w-7xl mx-auto px-6"><div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12"><div className="md:col-span-2 space-y-4"><Link to="/" className="text-2xl font-extrabold text-white">{settings.storeName}</Link><p className="text-xs max-w-sm">Consulta precios por talla y prueba las prendas con nuestro probador virtual.</p>{settings.email && <a href={`mailto:${settings.email}`} className="block text-sm hover:text-white">{settings.email}</a>}</div>{groups.map((group) => <div key={group.title}><h3 className="text-white text-xs font-bold uppercase mb-3">{group.title}</h3><ul className="space-y-2 text-xs">{group.links.map(([label, path]) => <li key={path}><Link to={path} className="hover:text-white">{label}</Link></li>)}</ul></div>)}</div><p className="text-xs border-t border-slate-800 pt-8">© {new Date().getFullYear()} {settings.storeName} · Pagos con Mercado Pago · PEN</p></div></footer>;
}
