import React, { useState } from "react";
import type { User } from "../../../data/adminPrototypeTypes";

interface Client extends User {
  orders: number;
  spent: number;
  status: "active" | "blocked";
}

interface AdminCustomersViewProps {
  clients: User[];
}

export default function AdminCustomersView({
  clients: initialClients,
}: AdminCustomersViewProps) {
  const [clients, setClients] = useState<Client[]>(
    initialClients.map((c) => ({
      ...c,
      status: "active",
      orders: Math.floor(Math.random() * 10),
      spent: Math.floor(Math.random() * 1000) + 100,
    })),
  );

  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleClientStatus = (clientId: string) => {
    setClients((curr) =>
      curr.map((c) => {
        if (c.id === clientId) {
          const newStatus = c.status === "active" ? "blocked" : "active";
          if (selectedClient?.id === clientId) {
            setSelectedClient({ ...c, status: newStatus });
          }
          return { ...c, status: newStatus };
        }
        return c;
      }),
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full text-gray-900 dark:text-white animate-fade-in">
      <div className={`flex-1 ${selectedClient ? "hidden lg:block" : "block"}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {clients.length} registrados
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all shadow-sm"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-zinc-950/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Pedidos</th>
                  <th className="px-5 py-4">Total gastado</th>
                  <th className="px-5 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? "bg-[#00FF66]/10 dark:bg-[#00FF66]/5"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={client.avatar}
                          alt={client.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-zinc-700"
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-200">
                            {client.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {client.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold">{client.orders}</td>
                    <td className="px-5 py-4 font-bold text-[#00FF66]">
                      S/ {client.spent.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          client.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500"
                        }`}
                      >
                        {client.status === "active" ? "activo" : "bloqueado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No se encontraron clientes.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedClient && (
        <div className="w-full lg:w-[400px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-lg flex flex-col sticky top-6 animate-slide-in-right self-start">
          <div className="p-6 text-center border-b border-gray-100 dark:border-zinc-800 relative">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <img
              src={selectedClient.avatar}
              alt={selectedClient.name}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 border-4 border-white dark:border-zinc-800 shadow-md"
            />
            <h2 className="font-bold text-xl">{selectedClient.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{selectedClient.email}</p>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize inline-block ${
                selectedClient.status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500"
              }`}
            >
              {selectedClient.status === "active" ? "activo" : "bloqueado"}
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                <p className="font-bold text-sm">{selectedClient.phone}</p>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                <p className="text-xs text-gray-500 mb-1">Registro</p>
                <p className="font-bold text-sm">
                  {selectedClient.registeredAt}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                <p className="text-xs text-gray-500 mb-1">Pedidos</p>
                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {selectedClient.orders}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                <p className="text-xs text-gray-500 mb-1">Total gastado</p>
                <p className="font-bold text-lg text-[#00FF66]">
                  S/ {selectedClient.spent.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleClientStatus(selectedClient.id)}
              className={`w-full mt-4 py-3 rounded-xl font-bold transition-all ${
                selectedClient.status === "active"
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50"
                  : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-900/50"
              }`}
            >
              {selectedClient.status === "active"
                ? "Bloquear cliente"
                : "Desbloquear cliente"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
