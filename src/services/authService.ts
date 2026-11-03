
import { api } from "./api";
import type { UsuarioLogado } from "./sessionService";

export const loginNutricionista = (
  email: string,
  senha: string
) =>
  api<{
    token: string;
    nutricionista: UsuarioLogado;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });

export const cadastrarNutricionista = (
  nome: string,
  email: string,
  senha: string,
  crn: string
) =>
  api<{
    nutricionista: UsuarioLogado;
  }>("/api/auth/cadastro", {
    method: "POST",
    body: JSON.stringify({
      nome,
      email,
      senha,
      crn,
    }),
  });
