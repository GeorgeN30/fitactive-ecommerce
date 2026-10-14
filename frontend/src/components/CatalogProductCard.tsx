import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import ProductOffer from "./ProductOffer";
import { getCatalogPrice, type CatalogProduct } from "../services/catalog";

export default function CatalogProductCard({ product }: { product: CatalogProduct }) {
  const image = product.imagenUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&fit=crop";
  const pricing = getCatalogPrice(product);
  return <article className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex flex-col shadow-sm">
    <div className="relative rounded-xl bg-gray-100 dark:bg-gray-800 aspect-[4/5] overflow-hidden mb-3">
      <Link to={`/producto/${product.id}`} className="block w-full h-full"><img src={image} alt={product.nombre} className="object-contain p-3 w-full h-full" /></Link>
      <span className="absolute top-3 left-3 rounded bg-gray-900 text-white px-2 py-1 text-[10px]">{product.totalStock === 0 ? "AGOTADO" : product.totalStock <= 5 ? "STOCK LIMITADO" : "EN STOCK"}</span>
      <FavoriteButton product={{ id: product.id, cat: product.categoria || "General", name: product.nombre, price: pricing.price, img: image }} className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-700 rounded-full" />
    </div>
    <p className="text-xs text-gray-500">{product.categoria || "General"}{product.marca ? ` · ${product.marca}` : ""}</p>
    <h3 className="font-bold"><Link to={`/producto/${product.id}`}>{product.nombre}</Link></h3>
    <ProductOffer product={product} />
    <p className="text-xs text-gray-500 mb-3">Tallas disponibles: {product.tallas.filter((size) => size.stock > 0).map((size) => size.talla).join(", ") || "Ninguna"}</p>
    <div className="flex gap-2 mt-auto"><Link to={`/producto/${product.id}`} className="flex-1 p-2 text-center text-xs rounded-lg bg-gray-100 dark:bg-gray-700">Ver detalle</Link><Link to={`/probador-virtual?producto=${product.id}`} className="flex-1 p-2 text-center text-xs rounded-lg bg-brand-green text-black">Probar AR</Link></div>
  </article>;
}
