
import { obterSessao } from "./sessionService";

export interface SolicitacaoVinculo {
  id: string;
  pacienteId: string;
  nomePaciente: string;
  status: "PENDENTE" | "APROVADO" | "RECUSADO";
  createdAt: string;
}

interface RespostaSolicitacoes {
  solicitacoes: SolicitacaoVinculo[];
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

async function requisicaoAutenticada(
  caminho: string,
  metodo: "GET" | "PATCH" = "GET"
): Promise<Response> {
  const sessao = obterSessao();

  if (!sessao?.token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const resposta = await fetch(
    `${API_URL}/api/vinculacoes${caminho}`,
    {
      method: metodo,
      headers: {
        Authorization: `Bearer ${sessao.token}`,
      },
    }
  );

  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => null);

    throw new Error(
      dados?.mensagem ||
        "Não foi possível concluir a operação."
    );
  }

  return resposta;
}

export async function buscarSolicitacoes(): Promise<
  SolicitacaoVinculo[]
> {
  const resposta = await requisicaoAutenticada(
    "/solicitacoes"
  );

  const dados =
    (await resposta.json()) as RespostaSolicitacoes;

  return dados.solicitacoes;
}

export async function aprovarSolicitacao(
  id: string
): Promise<void> {
  await requisicaoAutenticada(
    `/${encodeURIComponent(id)}/aprovar`,
    "PATCH"
  );
}

export async function recusarSolicitacao(
  id: string
): Promise<void> {
  await requisicaoAutenticada(
    `/${encodeURIComponent(id)}/recusar`,
    "PATCH"
  );
}

