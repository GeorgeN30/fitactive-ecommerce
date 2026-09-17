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

export default function AdminRolesAccessView({
  users: initialUsers,
  onRoleChange,
}: AdminRolesAccessViewProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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

  return (
    <div className="flex h-full flex-col gap-6 text-gray-900 dark:text-white animate-fade-in">
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

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-gray-100 p-5 dark:border-zinc-800">
          <h2 className="font-bold">Usuarios del sistema</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El cambio se guarda inmediatamente en la base de datos.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-gray-400">
              <tr>
                <th className="px-5 py-4">Usuario</th>
                <th className="px-5 py-4">Rol</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {users.map((user) => (
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
          {users.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              No hay usuarios registrados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
