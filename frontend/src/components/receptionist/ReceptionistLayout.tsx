import { Navigate } from "react-router-dom";

/** Legacy inventory shell: route to the database-backed inventory application. */
export default function ReceptionistLayout() {
  return <Navigate replace to="/inventory" />;
}
