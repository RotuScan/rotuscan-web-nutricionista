
import { api } from "./api";
import { obterSessao } from "./sessionService";

export interface ScanPorDia {
  data: string;
  total: number;
}

export interface UltimoScan {
  id: string;
  nomeProduto: string;
  paciente: string;
  data: string;
  veredito: string;
}

export interface DadosDashboard {
  totalPacientes: number;
  totalScans: number;
  alertasRecentes: number;
  scansPorDia: ScanPorDia[];
  ultimosScans: UltimoScan[];
}

export async function buscarDashboard(): Promise<DadosDashboard> {
  const sessao = obterSessao();

  if (!sessao) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  return api<DadosDashboard>("/api/dashboard", {
    headers: {
      Authorization: `Bearer ${sessao.token}`,
    },
  });
}
