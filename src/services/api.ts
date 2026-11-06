
import {
  obterSessao,
  encerrarSessao,
} from "./sessionService";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = obterSessao()?.token;

  const headers = new Headers(options.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    options.body != null &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
  if (error instanceof Error && error.name === "AbortError") {
    throw error;
  }

  throw new Error(
    "Não foi possível conectar ao servidor. Verifique sua conexão.",
    { cause: error }
  );
}

  let dados: unknown = {};

  if (resposta.status !== 204) {
    const texto = await resposta.text();

    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        dados = {};
      }
    }
  }

  if (!resposta.ok) {
    const mensagem =
      dados &&
      typeof dados === "object" &&
      "mensagem" in dados &&
      typeof dados.mensagem === "string"
        ? dados.mensagem
        : `Erro HTTP ${resposta.status}`;

    const rotaAutenticacao =
      path === "/api/auth/login" ||
      path === "/api/auth/cadastro";

    if (
      resposta.status === 401 &&
      token &&
      !rotaAutenticacao
    ) {
      if (obterSessao()?.token === token) {
        encerrarSessao();

        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }

      throw new Error(
        "Sua sessão não é mais válida. Faça login novamente."
      );
    }

    throw new Error(mensagem);
  }

  return dados as T;
}
