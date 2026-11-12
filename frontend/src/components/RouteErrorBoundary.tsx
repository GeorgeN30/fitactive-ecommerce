import { Component, type ReactNode } from "react";
export default class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="p-8 min-h-screen flex flex-col items-center justify-center gap-5 text-gray-900 dark:text-white"><h1 className="text-2xl font-bold">No se pudo mostrar esta página</h1><p>Vuelve a intentarlo para recuperar la información.</p><button onClick={() => window.location.reload()} className="px-5 py-3 rounded-lg bg-brand-green text-black">Reintentar</button><a href="/catalogo" className="underline">Volver al catálogo</a></main>;
    return this.props.children;
  }
}
