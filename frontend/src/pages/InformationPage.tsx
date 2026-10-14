import { Link, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { LEGAL_DOCS } from "../components/AuthLayout";
import { useStoreSettings } from "../context/StoreSettingsContext";

const support = {
  envios: { title: "Envíos", paragraphs: ["Ingresa tu dirección, distrito y ciudad al comprar. El estado del pedido y sus actualizaciones se consultan en Mis compras.", "Una compra pendiente de pago todavía no está confirmada. Si necesitas consultar una entrega, indica el número de pedido en Contacto."] },
  devoluciones: { title: "Cambios y devoluciones", paragraphs: ["Puedes solicitar la devolución de una compra entregada desde el detalle de tu pedido. Indica el motivo y los artículos que deseas devolver.", "La solicitud es revisada por el administrador. La aprobación no significa que ya se haya realizado un reembolso: consulta el estado de recepción y reembolso en tu pedido."] },
  tallas: { title: "Guía de tallas", paragraphs: ["Cada producto muestra las tallas disponibles y su stock. Consulta la guía en el detalle del producto y usa el probador para comparar tus medidas con los rangos de la prenda.", "La recomendación del probador es orientativa. Selecciona una talla antes de agregar el producto al carrito; las ofertas pueden variar por talla."] },
  faq: { title: "Preguntas frecuentes", paragraphs: ["¿Por qué cambia el precio por talla? Los descuentos se aprueban por talla y solo durante su vigencia. El catálogo indica Desde cuando hay precios distintos.", "¿Cuándo se confirma mi pago? Mercado Pago informa el resultado al sistema. Puedes consultar el estado en Mis compras; una redirección por sí sola no confirma un cobro.", "¿Cómo recupero mi cuenta? Usa Olvidé mi contraseña en el acceso. Si activaste 2FA, también necesitarás el código de tu autenticador."] },
  cookies: { title: "Cookies y almacenamiento", paragraphs: ["La tienda utiliza almacenamiento del navegador para la sesión, el carrito, los favoritos y las preferencias de tema. Al cerrar sesión se eliminan los datos asociados a esa sesión.", "Puedes borrar esos datos desde la configuración de tu navegador. Las pasarelas y otros servicios externos pueden utilizar sus propias cookies."] },
  probador: { title: "Acerca del probador virtual", paragraphs: ["El avatar y la compatibilidad por medidas son una representación orientativa. No garantizan un ajuste físico exacto de la prenda.", "Puedes guardar tus medidas en tu perfil, seleccionar una talla disponible y guardar la prenda en favoritos."] },
};
export default function InformationPage() {
  const { slug } = useParams();
  const settings = useStoreSettings();
  const legal = slug === "terminos" ? LEGAL_DOCS.terms : slug === "privacidad" ? LEGAL_DOCS.privacy : null;
  const info = support[slug as keyof typeof support];
  return <AppLayout><main className="max-w-4xl mx-auto px-6 py-12 min-h-[60vh] text-gray-900 dark:text-white space-y-6">
    <h1 className="text-3xl font-bold">{legal?.title || info?.title || "Página no encontrada"}</h1>
    {legal ? <><p>{legal.intro}</p>{legal.sections.map((section) => <section key={section.heading} className="space-y-3"><h2 className="text-xl font-bold">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</> : info?.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    <div className="flex flex-wrap gap-4"><Link to="/catalogo" className="underline">Catálogo</Link><Link to="/mis-compras" className="underline">Mis compras</Link><Link to="/soporte/contacto" className="underline">Contacto</Link>{settings.email && <a href={`mailto:${settings.email}`} className="underline">{settings.email}</a>}</div>
  </main></AppLayout>;
}
