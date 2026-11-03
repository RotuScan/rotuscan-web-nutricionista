
import { obterSessao, encerrarSessao } from "./sessionService";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = obterSessao()?.token;

  let resposta: Response;

  try {
    resposta = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao backend. Confira se ele está ligado."
    );
  }

  const dados = await resposta.json().catch(() => ({}));

  if (resposta.status === 401) {
    if (token && obterSessao()?.token === token) {
      encerrarSessao();
      window.location.replace("/login");
    }

    throw new Error(
      dados.mensagem || "Sua sessão expirou. Faça login novamente."
    );
  }

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || `Erro HTTP ${resposta.status}`
    );
  }

  return dados as T;
}
