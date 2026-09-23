import { useEffect, useState } from "react";
import type { User } from "../../../data/adminPrototypeTypes";

interface AdminRolesAccessViewProps {
  users: User[];
  onRoleChange: (user: User, role: User["role"]) => Promise<User>;
}

const ROLE_LABELS: Record<User["role"], string> = {
  client: "Cliente",
  admin: "Administrador",
  inventory: "Gestor de inventario",
};

const ROLE_COLORS: Record<User["role"], string> = {
  client: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  inventory: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ROLE_PERMISSIONS: Record<User["role"], string[]> = {
  client: ["Ver catálogo", "Usar probador", "Realizar compras", "Ver historial propio"],
  admin: ["Gestionar usuarios", "Gestionar pedidos", "Ver métricas", "Gestionar configuración"],
  inventory: ["Gestionar productos", "Actualizar stock", "Ver auditoría", "Solicitar descuentos"],
};

const USERS_PER_PAGE = 10;

export default function AdminRolesAccessView({
  users: initialUsers,
  onRoleChange,
}: AdminRolesAccessViewProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  async function handleRoleChange(user: User, role: User["role"]) {
    if (role === user.role || updatingUserId) return;

    setUpdatingUserId(user.id);
    try {
      const updated = await onRoleChange(user, role);
      setUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === updated.id ? updated : currentUser,
        ),
      );
    } catch {
      window.alert("No se pudo actualizar el rol del usuario.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    !normalizedSearch ||
    user.name.toLowerCase().includes(normalizedSearch) ||
    user.email.toLowerCase().includes(normalizedSearch) ||
    ROLE_LABELS[user.role].toLowerCase().includes(normalizedSearch),
  );
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 text-gray-900 dark:text-white animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Roles y accesos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gestiona los permisos asignados a cada usuario.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(ROLE_LABELS) as User["role"][]).map((role) => (
          <div
            key={role}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">{ROLE_LABELS[role]}</h2>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${ROLE_COLORS[role]}`}>
                {users.filter((user) => user.role === role).length}
              </span>
            </div>
            <div className="space-y-1.5">
              {ROLE_PERMISSIONS[role].map((permission) => (
                <p key={permission} className="text-xs text-gray-500 dark:text-gray-400">
                  <i
                    className="fa-solid fa-check mr-2 text-[#00FF66]"
                    aria-hidden="true"
                  />
                  {permission}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex-shrink-0 space-y-4 border-b border-gray-100 p-5 dark:border-zinc-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold">Usuarios del sistema</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                El cambio se guarda inmediatamente en la base de datos.
              </p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredUsers.length} {filteredUsers.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
          <div className="relative max-w-xl">
            <i
              className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Buscar usuarios del sistema"
              placeholder="Buscar por nombre, correo o rol..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-white"
            />
            {search && (
              <button
                type="button"
                aria-label="Limpiar búsqueda de usuarios"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[700px] text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 text-gray-500 dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-gray-400">
              <tr>
                <th className="px-5 py-4">Usuario</th>
                <th className="px-5 py-4">Rol</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-zinc-700"
                      />
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      aria-label={`Rol de ${user.name}`}
                      value={user.role}
                      disabled={updatingUserId === user.id}
                      onChange={(event) =>
                        void handleRoleChange(
                          user,
                          event.target.value as User["role"],
                        )
                      }
                      className={`rounded-xl border-0 px-3 py-2 text-xs font-bold outline-none ${ROLE_COLORS[user.role]}`}
                    >
                      <option value="client">Cliente</option>
                      <option value="inventory">Gestor de inventario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        user.blocked
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {user.blocked ? "Bloqueado" : "Activo"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                    {user.registeredAt || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              {users.length === 0
                ? "No hay usuarios registrados."
                : "No se encontraron usuarios con esa búsqueda."}
            </p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-zinc-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mostrando {(currentPage - 1) * USERS_PER_PAGE + 1}–{Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length}
            </p>
            <nav className="flex items-center gap-2" aria-label="Paginación de usuarios">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                Anterior
              </button>
              <span className="min-w-24 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                Siguiente
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
