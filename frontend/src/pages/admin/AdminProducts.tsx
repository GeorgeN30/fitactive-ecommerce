import { useState, useMemo } from "react";
import type { Product, Size, ProductCategory, Sport, ProductStatus } from "../../data/types";
import { mockProducts } from "../../data/mock";
import StatusBadge from "../../components/admin/StatusBadge";

const ITEMS_PER_PAGE = 6;

const sizeOptions: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const categoryOptions: ProductCategory[] = ["Clothing", "Footwear", "Accessories"];
const sportOptions: Sport[] = ["Running", "Gym", "Cycling", "CrossFit", "Yoga"];
const statusOptions: ProductStatus[] = ["Active", "OutOfStock", "Inactive"];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedSvg, setSelectedSvg] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Clothing" as ProductCategory,
    sport: "Running" as Sport,
    price: "",
    stock: "",
    sizes: [] as Size[],
    isPublished: true,
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || p.category === filterCategory;
      const matchSport = !filterSport || p.sport === filterSport;
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchCategory && matchSport && matchStatus;
    });
  }, [products, search, filterCategory, filterSport, filterStatus]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "Active").length;
  const inactiveProducts = products.filter((p) => p.status !== "Active").length;

  function toggleSize(size: Size) {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stockPerSize = Math.floor(Number(formData.stock) / Math.max(formData.sizes.length, 1));
    const productData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      sport: formData.sport,
      price: Number(formData.price),
      sizes: formData.sizes.map((s) => ({ size: s, stock: stockPerSize })),
      totalStock: Number(formData.stock),
      status: "Active",
      imageUrl: imagePreview || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
      isPublished: formData.isPublished,
    } satisfies Omit<Product, "id" | "sku">;

    if (editingProductId) {
      setProducts((prev) => prev.map((product) => (
        product.id === editingProductId ? { ...product, ...productData } : product
      )));
    } else {
      setProducts((prev) => [...prev, {
        id: String(Date.now()),
        sku: `FT-${formData.sport.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        ...productData,
      }]);
    }

    setModalOpen(false);
    setEditingProductId(null);
    setSelectedImage(null);
    setSelectedSvg(null);
    setImagePreview(null);
    setFormData({ name: "", description: "", category: "Clothing", sport: "Running", price: "", stock: "", sizes: [], isPublished: true });
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function openAddModal() {
    setEditingProductId(null);
    setSelectedImage(null);
    setSelectedSvg(null);
    setImagePreview(null);
    setFormData({ name: "", description: "", category: "Clothing", sport: "Running", price: "", stock: "", sizes: [], isPublished: true });
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProductId(product.id);
    setSelectedImage(null);
    setSelectedSvg(null);
    setImagePreview(product.imageUrl);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      sport: product.sport,
      price: String(product.price),
      stock: String(product.totalStock),
      sizes: product.sizes.map((size) => size.size),
      isPublished: product.isPublished,
    });
    setModalOpen(true);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Gestion de Productos</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Administra el catalogo de productos FitLook</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-brand-green hover:bg-brand-green-hover text-black font-bold text-xs px-5 py-3 rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-105"
        >
          <i className="fa-solid fa-plus text-xs stroke-[3]" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Total Productos</span>
          <h3 className="text-3xl font-black text-slate-900 mt-2">{totalProducts}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Con Stock</span>
          <h3 className="text-3xl font-black text-slate-900 mt-2">{activeProducts}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Sin Stock</span>
          <h3 className="text-3xl font-black text-slate-900 mt-2">{inactiveProducts}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, categoria o SKU..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-green text-xs rounded-xl focus:outline-none font-semibold"
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer">
            <option value="">Categoria: Todas</option>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSport} onChange={(e) => { setFilterSport(e.target.value); setPage(1); }} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer">
            <option value="">Deporte: Todos</option>
            {sportOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer">
            <option value="">Estado: Todos</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="py-3.5 px-4">Imagen</th>
                <th className="py-3.5 px-6">Producto</th>
                <th className="py-3.5 px-6">Categoria</th>
                <th className="py-3.5 px-6">Deporte</th>
                <th className="py-3.5 px-6">Tallas</th>
                <th className="py-3.5 px-6">Precio</th>
                <th className="py-3.5 px-6">Stock</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="py-4 px-4">
                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">{p.sku}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">{p.category}</td>
                  <td className="py-4 px-6 text-slate-500">{p.sport}</td>
                  <td className="py-4 px-6">
                    <div className="flex gap-1 flex-wrap">
                      {p.sizes.filter((s) => s.stock > 0).map((s) => (
                        <span key={s.size} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                          {s.size}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">${p.price.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <span className={`font-extrabold ${p.totalStock < 5 ? "text-amber-500" : "text-emerald-600"}`}>
                      {p.totalStock}
                    </span>
                  </td>
                  <td className="py-4 px-6"><StatusBadge status={p.status} /></td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        aria-label={`Editar ${p.name}`}
                        title="Editar producto"
                        className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        aria-label={`Eliminar ${p.name}`}
                        title="Eliminar producto"
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <i className="fa-solid fa-trash-can text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} productos</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50">
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-lg transition-all ${page === p ? "bg-brand-green text-black font-bold" : "border border-slate-200 hover:bg-slate-100"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50">
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 id="product-modal-title" className="text-lg font-bold text-slate-900">
                {editingProductId ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripcion</label>
                <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-brand-green h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select value={formData.category} onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value as ProductCategory }))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none">
                    {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deporte</label>
                  <select value={formData.sport} onChange={(e) => setFormData((f) => ({ ...f, sport: e.target.value as Sport }))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none">
                    {sportOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio (S/.)</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Minimo</label>
                  <input type="number" required value={formData.stock} onChange={(e) => setFormData((f) => ({ ...f, stock: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-brand-green" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fotos del Producto</label>
                  <label htmlFor="product-image" className="min-h-32 border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 hover:border-brand-green transition-all cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Vista previa del producto" className="w-16 h-16 rounded-xl object-cover mb-2" />
                    ) : (
                      <i className="fa-solid fa-image text-2xl text-slate-400 mb-2" />
                    )}
                    <span className="text-xs font-bold text-slate-700">
                      {selectedImage?.name || "Arrastra imagenes o haz clic para subir"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">PNG, JPG hasta 10MB</span>
                  </label>
                  <input
                    id="product-image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedImage(file);
                      if (file) setImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SVG de Probador Virtual</label>
                  <label htmlFor="product-svg" className="min-h-32 border-2 border-dashed border-brand-green/60 rounded-2xl p-4 bg-brand-green/5 flex flex-col items-center justify-center text-center hover:bg-brand-green/10 transition-all cursor-pointer">
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-brand-green mb-2" />
                    <span className="text-xs font-bold text-slate-800">
                      {selectedSvg?.name || "Subir SVG para probador virtual"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Archivo SVG</span>
                  </label>
                  <input
                    id="product-svg"
                    type="file"
                    accept="image/svg+xml,.svg"
                    className="sr-only"
                    onChange={(e) => setSelectedSvg(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tallas</label>
                <div className="flex gap-2">
                  {sizeOptions.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSize(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.sizes.includes(s) ? "bg-brand-green/10 border-brand-green text-brand-green" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="publish" checked={formData.isPublished} onChange={(e) => setFormData((f) => ({ ...f, isPublished: e.target.checked }))} className="rounded border-slate-300 text-brand-green focus:ring-brand-green" />
                <label htmlFor="publish" className="text-xs font-bold text-slate-700">Publicar inmediatamente</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-black text-xs font-bold rounded-xl transition-all">
                  {editingProductId ? "Actualizar Producto" : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
