import React, { useState } from "react";

export default function InventoryDiscountsView({
  products = [],
}: {
  products?: any[];
}) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [reason, setReason] = useState("");
  const [appliedDiscounts, setAppliedDiscounts] = useState<any[]>([]);

  const highStockProducts = products.filter((p) => {
    const total = Object.values(p.stock).reduce(
      (a: any, b: any) => a + b,
      0,
    ) as number;
    return total > 25;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleApplyDiscount = () => {
    if (!selectedProduct || selectedSizes.length === 0) return;

    const newDiscount = {
      id: Date.now(),
      productName: selectedProduct.name,
      sizes: selectedSizes,
      percent: discountPercent,
      originalPrice: selectedProduct.price,
      discountedPrice: (
        selectedProduct.price *
        (1 - discountPercent / 100)
      ).toFixed(2),
    };

    setAppliedDiscounts([newDiscount, ...appliedDiscounts]);

    setSelectedProductId(null);
    setSelectedSizes([]);
    setDiscountPercent(30);
    setReason("");
  };

  return (
    <div className="animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto relative grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
            Seleccionar Producto
          </label>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {highStockProducts.map((p) => {
              const totalStock = Object.values(p.stock).reduce(
                (a: any, b: any) => a + b,
                0,
              ) as number;
              const isSelected = selectedProductId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#4F46E5] bg-[#4F46E5]/5"
                      : "border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover bg-white"
                  />
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      Stock: {totalStock} uds. · S/ {p.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
            Tallas a descontar
          </label>
          <div className="flex flex-wrap gap-2">
            {["XS", "S", "M", "L", "XL"].map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-colors border ${
                    isSelected
                      ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                      : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
            Porcentaje de descuento
          </label>
          <div className="flex flex-wrap gap-2">
            {[10, 15, 20, 25, 30, 40, 50].map((pct) => {
              const isSelected = discountPercent === pct;
              return (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                    isSelected
                      ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/30"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  -{pct}%
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
            Motivo (Opcional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Baja rotación talla XL, temporada fin de stock..."
            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#4F46E5] text-sm"
          />
        </div>

        <div className="bg-[#4F46E5]/5 border border-[#4F46E5]/20 rounded-2xl p-5">
          <p className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider mb-2">
            Vista previa
          </p>
          <p className="font-bold text-gray-900 dark:text-white">
            {selectedProduct ? selectedProduct.name : "Selecciona un producto"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500 line-through">
              S/ {selectedProduct ? selectedProduct.price.toFixed(2) : "0.00"}
            </span>
            <span className="text-sm text-gray-400">&rarr;</span>
            <span className="text-sm font-bold text-[#4F46E5]">
              S/{" "}
              {selectedProduct
                ? (selectedProduct.price * (1 - discountPercent / 100)).toFixed(
                    2,
                  )
                : "0.00"}
            </span>
          </div>
        </div>

        <button
          onClick={handleApplyDiscount}
          disabled={!selectedProduct || selectedSizes.length === 0}
          className="w-full py-4 rounded-xl bg-[#4F46E5] disabled:bg-[#4F46E5]/50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-[#4F46E5]/20 hover:bg-[#4338ca]"
        >
          Aplicar {discountPercent}% OFF a {selectedSizes.length} talla(s)
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800">
          <label className="text-sm font-bold text-gray-500 mb-4 block">
            Productos con alta acumulación de stock
          </label>
          <div className="space-y-3">
            {highStockProducts.slice(0, 4).map((p) => {
              const totalStock = Object.values(p.stock).reduce(
                (a: any, b: any) => a + b,
                0,
              ) as number;
              return (
                <div
                  key={"high-" + p.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {totalStock} uds.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProductId(p.id)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5]/20 transition-colors"
                  >
                    Seleccionar
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 min-h-[200px]">
          <label className="text-lg font-bold text-gray-900 dark:text-white mb-4 block">
            Descuentos aplicados
          </label>

          {appliedDiscounts.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 font-medium">
              Aún no has aplicado descuentos
            </div>
          ) : (
            <div className="space-y-3">
              {appliedDiscounts.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{d.productName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tallas: {d.sizes.join(", ")}
                      </p>
                    </div>
                    <span className="bg-[#4F46E5] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      -{d.percent}% OFF
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
