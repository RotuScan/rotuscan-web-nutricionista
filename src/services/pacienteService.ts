
import { api } from "./api";
import { obterSessao } from "./sessionService";

export interface Paciente {
  id: string;
  nome: string;
  restricoes: unknown[];
  niveisSensibilidade: Record<string, unknown>;
}

export async function buscarPacientes(): Promise<Paciente[]> {
  const sessao = obterSessao();

  if (!sessao) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const resposta = await api<{ pacientes: Paciente[] }>(
    "/api/pacientes",
    {
      headers: {
        Authorization: `Bearer ${sessao.token}`,
      },
    }
  );

  return resposta.pacientes;
}


export interface ScanPaciente {
  id: string;
  nomeProduto: string;
  veredito: string;
  createdAt: string;
  intoleranciaDetectada: unknown[];
  alergicosDetectados: unknown[];
}

export interface DetalhesPaciente {
  paciente: Paciente & {
    email: string;
  };
  scans: ScanPaciente[];
}

export async function buscarPacientePorId(
  id: string
): Promise<DetalhesPaciente> {
  const sessao = obterSessao();

  if (!sessao) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  return api<DetalhesPaciente>(
    `/api/pacientes/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${sessao.token}`,
      },
    }
  );
}
