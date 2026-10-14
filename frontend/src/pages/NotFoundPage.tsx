import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
export default function NotFoundPage() { return <AppLayout><main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-900 dark:text-white"><h1 className="text-3xl font-bold">Página no encontrada</h1><p>Revisa la dirección o vuelve al catálogo.</p><Link to="/catalogo" className="underline">Explorar catálogo</Link></main></AppLayout>; }
