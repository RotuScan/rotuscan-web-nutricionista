
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import {
  obterSessao,
  encerrarSessao,
} from "../services/sessionService";

interface TokenPayload {
  exp?: number;
}

function tokenExpirado(token: string): boolean {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      return true;
    }

    const base64 = partes[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const payload = JSON.parse(
      atob(base64)
    ) as TokenPayload;

    if (
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp)
    ) {
      return true;
    }

    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();
  const sessao = obterSessao();

  if (!sessao) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (tokenExpirado(sessao.token)) {
    encerrarSessao();

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
