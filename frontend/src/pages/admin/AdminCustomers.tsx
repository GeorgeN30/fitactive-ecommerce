import { useState, useMemo } from "react";
import type { Customer, CustomerStatus, CustomerRole } from "../../data/types";
import { mockCustomers } from "../../data/mock";
import StatusBadge from "../../components/admin/StatusBadge";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    mockCustomers[0],
  );

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const blockedCustomers = customers.filter(
    (c) => c.status === "Blocked",
  ).length;
  const adminCustomers = customers.filter((c) => c.role === "Admin").length;

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || c.status === filterStatus;
      const matchRole = !filterRole || c.role === filterRole;
      return matchSearch && matchStatus && matchRole;
    });
  }, [customers, search, filterStatus, filterRole]);

  function handleToggleStatus(id: string) {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newStatus: CustomerStatus =
          c.status === "Active" ? "Blocked" : "Active";
        const updated = { ...c, status: newStatus };
        if (selectedCustomer?.id === id) setSelectedCustomer(updated);
        return updated;
      }),
    );
  }

  function handleRoleChange(id: string, role: CustomerRole) {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, role };
        if (selectedCustomer?.id === id) setSelectedCustomer(updated);
        return updated;
      }),
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Gestion de Clientes
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Visualiza y gestiona las cuentas de clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Total Registrados
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {totalCustomers}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Activo
          </span>
          <h3 className="text-2xl font-black text-emerald-500 mt-1">
            {activeCustomers}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Bloqueado
          </span>
          <h3 className="text-2xl font-black text-rose-500 mt-1">
            {blockedCustomers}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Administradores
          </span>
          <h3 className="text-2xl font-black text-blue-500 mt-1">
            {adminCustomers}
          </h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-green text-xs rounded-xl focus:outline-none font-semibold"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
        >
          <option value="">Estado: Todos</option>
          <option value="Active">Activo</option>
          <option value="Blocked">Bloqueado</option>
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
        >
          <option value="">Rol: Todos</option>
          <option value="Customer">Cliente</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Avatar</th>
                  <th className="py-3.5 px-6">Nombre / Email</th>
                  <th className="py-3.5 px-6">Registro</th>
                  <th className="py-3.5 px-6">Pedidos</th>
                  <th className="py-3.5 px-6">Total</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedCustomer?.id === c.id ? "bg-brand-green/5" : ""}`}
                  >
                    <td className="py-4 px-4">
                      <div
                        className={`w-9 h-9 rounded-full ${c.avatarColor} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {c.initials}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="block text-[10px] text-slate-400">
                        {c.email}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(c.registrationDate).toLocaleDateString(
                        "es-CL",
                        { month: "short", day: "numeric" },
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {c.ordersCount}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      ${c.totalSpent.toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={c.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4">
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 sticky top-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-full ${selectedCustomer.avatarColor} flex items-center justify-center text-white text-lg font-bold`}
                  >
                    {selectedCustomer.initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedCustomer.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
                    Estado de Cuenta
                  </label>
                  <button
                    onClick={() => handleToggleStatus(selectedCustomer.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCustomer.status === "Active"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    }`}
                  >
                    {selectedCustomer.status === "Active"
                      ? "Activo - Click para Bloquear"
                      : "Bloqueado - Click para Activar"}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
                    Rol de Usuario
                  </label>
                  <select
                    value={selectedCustomer.role}
                    onChange={(e) =>
                      handleRoleChange(
                        selectedCustomer.id,
                        e.target.value as CustomerRole,
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="Customer">Cliente</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                    Gastado Total
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">
                    ${selectedCustomer.totalSpent.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                    Pedidos
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">
                    {selectedCustomer.ordersCount}
                  </p>
                </div>
              </div>

              {selectedCustomer.recentOrders.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                    Pedidos Recientes
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.recentOrders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-700">
                            #{o.id}
                          </span>
                          <span className="text-slate-400 ml-2">{o.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">
                            ${o.total.toFixed(2)}
                          </span>
                          <StatusBadge status={o.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center text-slate-400 text-xs">
              Selecciona un cliente para ver detalles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
