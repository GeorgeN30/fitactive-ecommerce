import { Navigate } from "react-router-dom";

export type LegacyAdminModule = "products" | "orders" | "clients" | "roles" | "metrics" | "notifications" | "returns" | "config";
export default function LegacyAdminRedirect({ section }: { section: LegacyAdminModule }) {
  return <Navigate replace to={`/admin?section=${section}`} />;
}
