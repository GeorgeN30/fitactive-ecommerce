import React, { useState } from "react";

export default function AdminSettingsView() {
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [formData, setFormData] = useState({
    storeName: "FITLOOK Perú",
    email: "contacto@fitlook.com",
    currency: "PEN - Sol Peruano",
    gateway: "MercadoPago",
    sandbox: true,
    tax: 18,
    tolerance: "Moderado",
    hqRender: false,
    limit: 50,
    twoFactor: true,
    timeout: 30,
  });

  const handleSave = (sectionId: string) => {
    setSavingSection(sectionId);
    setTimeout(() => {
      setSavingSection(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const sections = [
    {
      id: "general",
      title: "Configuración General",
      icon: "fa-building",
      description: "Datos de la empresa, logo y moneda base",
      fields: [
        { key: "storeName", label: "Nombre de la Tienda", type: "text" },
        { key: "email", label: "Correo de Contacto", type: "email" },
        {
          key: "currency",
          label: "Moneda Principal",
          type: "select",
          options: ["PEN - Sol Peruano", "USD - Dólar", "EUR - Euro"],
        },
      ],
    },
    {
      id: "payments",
      title: "Pagos e Impuestos",
      icon: "fa-credit-card",
      description: "Pasarelas de pago y configuración de IGV",
      fields: [
        {
          key: "gateway",
          label: "Pasarela Principal",
          type: "select",
          options: ["MercadoPago", "Stripe", "Culqi", "Niubiz"],
        },
        { key: "sandbox", label: "Modo Pruebas (Sandbox)", type: "toggle" },
        { key: "tax", label: "Tasa de Impuesto (%)", type: "number" },
      ],
    },
    {
      id: "tryon",
      title: "Motor Probador Virtual",
      icon: "fa-vr-cardboard",
      description: "Ajustes del algoritmo de recomendación y 3D",
      fields: [
        {
          key: "tolerance",
          label: "Margen de Tolerancia (Tallas)",
          type: "select",
          options: ["Estricto", "Moderado", "Flexible"],
        },
        {
          key: "hqRender",
          label: "Renderizado 3D de alta calidad",
          type: "toggle",
        },
        {
          key: "limit",
          label: "Límite de intentos diarios por IP",
          type: "number",
        },
      ],
    },
    {
      id: "security",
      title: "Seguridad",
      icon: "fa-shield-halved",
      description: "Políticas de contraseñas y doble factor",
      fields: [
        {
          key: "twoFactor",
          label: "Exigir autenticación 2FA a staff",
          type: "toggle",
        },
        {
          key: "timeout",
          label: "Cierre de sesión automático (min)",
          type: "number",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 relative">
      <div
        className={`fixed top-6 right-6 bg-[#00FF66] text-black px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#00FF66]/20 transition-all duration-300 transform ${showToast ? "translate-y-0 opacity-100 z-50" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <i className="fa-solid fa-check-circle mr-2"></i> Cambios guardados
        exitosamente
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuración del Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra los parámetros generales, paísarelas y el algoritmo del
            probador
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-[#00FF66] text-xl">
                <i className={`fa-solid ${section.icon}`}></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">{section.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {section.description}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-5 flex-1 pb-16">
              {section.fields.map((f, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {f.label}
                  </label>

                  {f.type === "text" ||
                  f.type === "email" ||
                  f.type === "number" ? (
                    <input
                      type={f.type}
                      value={formData[f.key as keyof typeof formData] as any}
                      onChange={(e) =>
                        handleChange(
                          f.key,
                          f.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                        )
                      }
                      className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={formData[f.key as keyof typeof formData] as string}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all appearance-none cursor-pointer"
                    >
                      {f.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "toggle" ? (
                    <div className="flex items-center mt-1">
                      <button
                        onClick={() =>
                          handleChange(
                            f.key,
                            !formData[f.key as keyof typeof formData],
                          )
                        }
                        className={`w-12 h-6 rounded-full relative transition-colors ${formData[f.key as keyof typeof formData] ? "bg-[#00FF66]" : "bg-gray-300 dark:bg-zinc-700"}`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData[f.key as keyof typeof formData] ? "translate-x-6" : ""}`}
                        />
                      </button>
                      <span className="ml-3 text-sm font-medium text-gray-500">
                        {formData[f.key as keyof typeof formData]
                          ? "Activado"
                          : "Desactivado"}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="absolute bottom-6 right-6">
              <button
                onClick={() => handleSave(section.id)}
                disabled={savingSection !== null}
                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                {savingSection === section.id ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-save text-gray-400"></i>
                )}
                Guardar cambios
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
