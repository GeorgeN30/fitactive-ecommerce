import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Product } from "../../../data/adminPrototypeTypes";
import { createProduct, deleteProduct, fetchProducts, updateProduct, type ProductInput } from "../../../services/admin";

const blank: ProductInput = { nombre: "", precio: 0, categoria: "", marca: "", descripcion: "", genero: "unisex", imageUrls: [], tallas: [{ talla: "M", stock: 0 }] };
export default function AdminProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(blank);
  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await fetchProducts()); setError(""); }
    catch { setError("No se pudieron cargar los productos del servidor."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving) return;
    const name = form.nombre?.trim() || "";
    const size = form.tallas?.[0]?.talla.trim() || "";
    if (name.length < 2 || !Number.isFinite(form.precio) || form.precio <= 0 || !size) { setError("Completa nombre, un precio mayor que cero y al menos una talla."); return; }
    setSaving(true); setError("");
    const payload = { ...form, nombre: name, tallas: form.tallas?.map((item) => ({ ...item, talla: item.talla.trim() })).filter((item) => item.talla) };
    try {
      if (editingId) await updateProduct(editingId, payload);
      else await createProduct(payload);
      setForm(blank); setEditingId(null); await load();
    } catch (err) {
      const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(code === "PRODUCT_HAS_ORDERS" ? "No se puede eliminar el producto porque tiene pedidos vinculados." : "No se pudo guardar. Revisa los campos y vuelve a intentarlo.");
    } finally { setSaving(false); }
  };
  const edit = (product: Product) => {
    setEditingId(product.id);
    setForm({ nombre: product.name, precio: product.price, categoria: product.category, descripcion: product.description,
      genero: product.gender === "male" ? "Hombre" : product.gender === "female" ? "Mujer" : "Unisex",
      imageUrls: product.images, tallas: product.sizes.map((talla) => ({ talla, stock: product.stock[talla] || 0,
        rangoCmMin: product.sizeMeasurements?.[talla]?.[0], rangoCmMax: product.sizeMeasurements?.[talla]?.[1] })) });
  };
  const remove = async (product: Product) => {
    if (!window.confirm(`¿Eliminar ${product.name}?`)) return;
    try { await deleteProduct(product.id); await load(); }
    catch { setError("No se pudo eliminar; revisa pedidos, descuentos activos y vuelve a cargar."); }
  };
  return <div className="max-w-6xl space-y-6 pb-10 text-gray-900 dark:text-white">
    <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold">Productos</h1><p className="text-sm text-gray-500">Catálogo persistido en la base de datos.</p></div><input aria-label="Buscar productos administrativos" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos" className="border rounded-lg p-2 bg-transparent" /></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <form onSubmit={(event) => void submit(event)} className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border p-5 bg-white dark:bg-zinc-900">
      <h2 className="md:col-span-2 font-bold">{editingId ? "Editar producto" : "Registrar producto"}</h2>
      <label>Nombre<input required minLength={2} maxLength={150} aria-label="Nombre del producto" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <label>Precio (S/)<input required type="number" min="0" max="99999999" step="0.01" aria-label="Precio" value={form.precio} onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <label>Categoría<input maxLength={100} aria-label="Categoría" value={form.categoria || ""} onChange={(event) => setForm({ ...form, categoria: event.target.value })} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <label>Marca<input maxLength={100} aria-label="Marca" value={form.marca || ""} onChange={(event) => setForm({ ...form, marca: event.target.value })} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <label>Género<select aria-label="Género" value={form.genero || "Unisex"} onChange={(event) => setForm({ ...form, genero: event.target.value })} className="block w-full border rounded-lg p-2 bg-transparent"><option>Unisex</option><option>Hombre</option><option>Mujer</option><option>male</option><option>female</option></select></label>
      <label>Tallas (separadas por coma)<input required maxLength={100} aria-label="Tallas" value={(form.tallas || []).map((item) => item.talla).join(", ")} onChange={(event) => setForm({ ...form, tallas: event.target.value.split(",").map((talla) => ({ talla: talla.trim(), stock: form.tallas?.find((item) => item.talla === talla.trim())?.stock || 0 })) })} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <label>Stock por talla, separado por coma<input aria-label="Stock por talla" value={(form.tallas || []).map((item) => item.stock ?? 0).join(", ")} onChange={(event) => { const stocks = event.target.value.split(",").map((value) => Number(value)); setForm({ ...form, tallas: (form.tallas || []).map((item, index) => ({ ...item, stock: stocks[index] || 0 })) }); }} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <label>URLs de imágenes (una por línea)<textarea aria-label="URLs de imágenes" maxLength={15000} value={(form.imageUrls || []).join("\n")} onChange={(event) => setForm({ ...form, imageUrls: event.target.value.split("\n").filter(Boolean) })} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <label className="md:col-span-2">Descripción<textarea maxLength={10000} aria-label="Descripción" value={form.descripcion || ""} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} className="block w-full border rounded-lg p-2 bg-transparent" /></label>
      <div className="md:col-span-2 flex gap-3"><button disabled={saving} className="p-3 rounded-lg bg-brand-green text-black disabled:opacity-50">{saving ? "Guardando…" : editingId ? "Guardar edición" : "Crear producto"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blank); }} className="p-3 border rounded-lg">Cancelar</button>}</div>
    </form>
    {loading ? <p>Cargando productos…</p> : !visible.length ? <p>No hay productos que coincidan.</p> : <div className="overflow-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-3">Producto</th><th className="p-3">Categoría</th><th className="p-3">Precio</th><th className="p-3">Stock</th><th className="p-3">Acciones</th></tr></thead><tbody>{visible.map((product) => <tr key={product.id} className="border-t"><td className="p-3">{product.name}</td><td className="p-3">{product.category}</td><td className="p-3">S/ {product.price.toFixed(2)}</td><td className="p-3">{Object.values(product.stock).reduce((sum, count) => sum + count, 0)}</td><td className="p-3 flex gap-2"><button onClick={() => edit(product)} className="underline">Editar</button><button onClick={() => void remove(product)} className="underline text-red-600">Eliminar</button></td></tr>)}</tbody></table></div>}
  </div>;
}
