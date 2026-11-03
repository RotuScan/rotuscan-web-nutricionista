
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { obterSessao } from "../services/sessionService";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  const [autenticado, setAutenticado] = useState(
    () => obterSessao() !== null
  );

  useEffect(() => {
    function verificarSessao() {
      setAutenticado(obterSessao() !== null);
    }

    window.addEventListener(
      "rotuscan-session",
      verificarSessao
    );

    window.addEventListener(
      "focus",
      verificarSessao
    );

    return () => {
      window.removeEventListener(
        "rotuscan-session",
        verificarSessao
      );

      window.removeEventListener(
        "focus",
        verificarSessao
      );
    };
  }, []);

  if (!autenticado || !obterSessao()) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
