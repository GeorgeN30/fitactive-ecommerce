import React, { useState } from "react";
export default function InventoryCatalogView({
  products,
  setProducts,
}: {
  products: any[];
  setProducts: any;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({ name: "", sku: "", price: "" });
  const [errors, setErrors] = useState<any>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSaveProduct = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Requerido";
    if (!formData.sku.trim()) newErrors.sku = "Requerido";
    if (!formData.price || isNaN(Number(formData.price)))
      newErrors.price = "Inválido";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingId) {
      setProducts(
        products.map((p) =>
          p.id === editingId
            ? { ...p, name: formData.name, price: Number(formData.price) }
            : p,
        ),
      );
      showToast("¡Producto editado exitosamente!");
    } else {
      const newProduct = {
        id: Date.now(),
        name: formData.name,
        category: "Nueva Categoría",
        price: Number(formData.price),
        sales: 0,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=700&fit=crop&auto=format",
        stock: { S: 0, M: 0, L: 0 },
      };
      setProducts([newProduct, ...products]);
      showToast("¡Producto añadido al catálogo exitosamente!");
    }

    setIsModalOpen(false);
    setFormData({ name: "", sku: "", price: "" });
    setErrors({});
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };
  const confirmDelete = () => {
    if (deleteId) {
      setProducts(products.filter((p) => p.id !== deleteId));
      showToast("Producto eliminado del catálogo.");
      setDeleteId(null);
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      sku: `FIT-001-${p.id}`,
      price: p.price.toString(),
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[60] bg-[#00FF66] text-black px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <i className="fa-solid fa-circle-check"></i>
          {toastMessage}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up border border-gray-100 dark:border-zinc-800">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Nuevo Producto</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Polo Performance Dry-Fit"
                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border ${errors.name ? "border-red-500" : "border-gray-200 dark:border-zinc-800"} rounded-xl focus:outline-none focus:border-[#F59E0B]`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="FIT-001-BLK"
                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border ${errors.sku ? "border-red-500" : "border-gray-200 dark:border-zinc-800"} rounded-xl focus:outline-none focus:border-[#F59E0B]`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="FITLOOK"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Precio (S/) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0"
                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border ${errors.price ? "border-red-500" : "border-gray-200 dark:border-zinc-800"} rounded-xl focus:outline-none focus:border-[#F59E0B]`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Categoría *
                  </label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#F59E0B]">
                    <option>Tops</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Deporte
                  </label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#F59E0B]">
                    <option>Gym</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#F59E0B]"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Imagen del producto *
                </label>
                <div className="w-full border-2 border-díashed border-gray-200 dark:border-zinc-700 rounded-2xl p-10 flex flex-col items-center justify-center text-gray-400 hover:border-[#00FF66] hover:bg-[#00FF66]/5 transition-colors cursor-pointer">
                  <i className="fa-solid fa-camera text-3xl mb-3"></i>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    Clic para subir imagen del producto
                  </p>
                  <p className="text-xs mt-1">
                    PNG, JPG, SVG • Máx. 5MB • Recomendado: 600x700px
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-800 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 px-4 py-3 bg-[#00FF66] text-black font-bold rounded-xl hover:bg-[#00cc52] transition-colors shadow-lg shadow-[#00FF66]/20"
              >
                Añadir Producto
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {products.length} productos registrados
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#00FF66] text-black text-sm font-bold rounded-xl hover:bg-[#00cc52] transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Añadir Producto
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <select className="flex-1 px-4 py-2 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-600 dark:text-gray-400 focus:outline-none">
              <option>Todías las categorías</option>
              <option>Tops</option>
              <option>Bottoms</option>
              <option>Outerwear</option>
            </select>
            <select className="flex-1 px-4 py-2 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-600 dark:text-gray-400 focus:outline-none">
              <option>Todos los deportes</option>
              <option>Gym</option>
              <option>Running</option>
              <option>Yoga</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Deporte
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tallas
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Stock / Min
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((p) => {
                  const totalStock = Object.values(p.stock).reduce(
                    (a: any, b: any) => a + b,
                    0,
                  ) as number;
                  const minStock = 15;
                  const status =
                    totalStock === 0
                      ? "Agotado"
                      : totalStock < minStock
                        ? "Stock bajo"
                        : "Normal";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-gray-500">FITLOOK</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        FIT-001-{p.id}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {p.sport}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        <div className="flex gap-1">
                          {p.sizes.map((s: any) => (
                            <span
                              key={s}
                              className="px-1 border border-gray-200 dark:border-zinc-700 rounded text-[9px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full bg-black border border-gray-200" />
                          <div className="w-3 h-3 rounded-full bg-gray-500 border border-gray-200" />
                          <div className="w-3 h-3 rounded-full bg-blue-500 border border-gray-200" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        <span
                          className={
                            status === "Normal"
                              ? "text-[#00FF66]"
                              : "text-red-500"
                          }
                        >
                          {totalStock}
                        </span>{" "}
                        <span className="text-gray-400 font-normal">
                          / {minStock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full ${status === "Normal" ? "text-[#00FF66] bg-[#00FF66]/10" : status === "Agotado" ? "text-red-500 bg-red-500/10" : "text-[#F59E0B] bg-[#F59E0B]/10"}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-[#F59E0B] transition-colors flex items-center justify-center"
                          >
                            <i className="fa-solid fa-pen text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-red-500 transition-colors flex items-center justify-center"
                          >
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          ></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center border border-gray-100 dark:border-zinc-800 animate-scale-up">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Eliminar producto</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
