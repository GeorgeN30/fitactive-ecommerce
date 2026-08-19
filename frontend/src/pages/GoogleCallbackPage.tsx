import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

export default function GoogleCallbackPage() {
  const [error, setError] = useState("");
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");

    if (!accessToken) {
      setError("No se recibio el token de Google.");
      return;
    }

    loginWithGoogle(accessToken)
      .then(() => navigate("/", { replace: true }))
      .catch(() => setError("Error al autenticar con Google."));
  }, [loginWithGoogle, navigate]);

  if (error) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-xmark text-red-500 text-xl" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Error</h1>
          <p className="text-sm text-slate-500 mb-8">{error}</p>
          <Link
            to="/login"
            className="inline-block w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm text-center"
          >
            Volver al inicio de sesion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <i className="fa-solid fa-spinner fa-spin text-brand-green text-xl" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Autenticando...
        </h1>
        <p className="text-sm text-slate-500">
          Espera un momento mientras verificamos tu cuenta.
        </p>
      </div>
    </AuthLayout>
  );
}
