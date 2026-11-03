
import "../styles/dashboard.css";

import { useEffect, useMemo, useState } from "react";
import {
  UsersRound,
  Bell,
  ScanLine,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  buscarDashboard,
  type DadosDashboard,
} from "../services/dashboardService";

type Periodo = 1 | 7 | 30;

const FUSO = "America/Sao_Paulo";

function obterDataBrasilia(data: Date): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const valores = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function montarGrafico(
  registros: DadosDashboard["scansPorDia"],
  periodo: Periodo
) {
  const totais = new Map(
    registros.map((registro) => [
      registro.data,
      registro.total,
    ])
  );

  const hojeBrasilia = obterDataBrasilia(new Date());

  const [ano, mes, dia] = hojeBrasilia
    .split("-")
    .map(Number);

  return Array.from({ length: periodo }, (_, indice) => {
    const deslocamento = periodo - indice - 1;

    const data = new Date(
      Date.UTC(ano, mes - 1, dia - deslocamento)
    );

    const chave = data.toISOString().slice(0, 10);

    const label = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    }).format(data);

    return {
      data: chave,
      label,
      total: totais.get(chave) ?? 0,
    };
  });
}

function formatarData(data: string): string {
  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "Data indisponível";
  }

  return dataConvertida.toLocaleString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [dados, setDados] = useState<DadosDashboard | null>(
    null
  );

  const [periodo, setPeriodo] = useState<Periodo>(7);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    buscarDashboard()
      .then((resposta) => {
        if (ativo) {
          setDados(resposta);
          setErro("");
        }
      })
      .catch((error) => {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o Dashboard."
          );
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const grafico = useMemo(
    () => montarGrafico(dados?.scansPorDia ?? [], periodo),
    [dados, periodo]
  );

  const maiorValor = Math.max(
    1,
    ...grafico.map((item) => item.total)
  );

  async function atualizarDados() {
    if (carregando || atualizando) return;

    setAtualizando(true);
    setErro("");

    try {
      const resposta = await buscarDashboard();
      setDados(resposta);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o Dashboard."
      );
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-toolbar">
        <button
          type="button"
          className="dashboard-refresh"
          onClick={atualizarDados}
          disabled={carregando || atualizando}
        >
          <RefreshCw
            size={16}
            className={atualizando ? "dashboard-spinning" : ""}
          />

          {atualizando
            ? "Atualizando..."
            : "Atualizar dados"}
        </button>
      </div>

      {erro && (
        <p role="alert" className="demo-disclaimer">
          <AlertCircle size={16} />
          {erro}
        </p>
      )}

      <div className="dashboard-stats">
        <article>
          <span>Total de pacientes</span>

          <strong>
            {carregando
              ? "..."
              : dados?.totalPacientes ?? "—"}
          </strong>

          <small>Pacientes vinculados</small>

          <UsersRound
            className="metric-icon green"
            size={25}
          />
        </article>

        <article>
          <span>Alertas recentes</span>

          <strong>
            {carregando
              ? "..."
              : dados?.alertasRecentes ?? "—"}
          </strong>

          <small>
            Scans perigosos nos últimos 7 dias
          </small>

          <Bell
            className="metric-icon red"
            size={25}
          />
        </article>

        <article>
          <span>Scans realizados</span>

          <strong>
            {carregando
              ? "..."
              : dados?.totalScans ?? "—"}
          </strong>

          <small>
            Total de leituras registradas
          </small>

          <ScanLine
            className="metric-icon blue"
            size={25}
          />
        </article>
      </div>

      <section className="dashboard-chart">
        <div className="dashboard-section-head">
          <div>
            <h2>Scans realizados</h2>
            <p>
              Frequência de diagnósticos e leituras
            </p>
          </div>

          <div className="period-tabs">
            {(
              [
                [1, "Hoje"],
                [7, "Últimos 7 dias"],
                [30, "Últimos 30 dias"],
              ] as const
            ).map(([valor, titulo]) => (
              <button
                key={valor}
                type="button"
                className={
                  periodo === valor ? "selected" : ""
                }
                aria-pressed={periodo === valor}
                onClick={() => setPeriodo(valor)}
              >
                {titulo}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div className="chart-empty">
            <p>Carregando gráfico...</p>
          </div>
        ) : !dados ? (
          <div className="chart-empty">
            <p>
              Não foi possível carregar os dados.
            </p>
          </div>
        ) : grafico.every((item) => item.total === 0) ? (
          <div className="chart-empty">
            <ScanLine size={40} />
            <p>
              Nenhum scan registrado neste período.
            </p>
          </div>
        ) : (
          <div className="dashboard-chart-scroll">
            <div
              className={`dashboard-chart-bars ${
                periodo === 30 ? "period-30" : ""
              }`}
            >
              {grafico.map((item) => {
                const altura =
                  (item.total / maiorValor) * 80;

                return (
                  <div
                    key={item.data}
                    className="dashboard-chart-column"
                    title={`${item.label}: ${item.total} scans`}
                  >
                    <span className="dashboard-chart-value">
                      {item.total}
                    </span>

                    <div
                      className="dashboard-chart-bar"
                      style={{
                        height: `${altura}%`,
                        minHeight: item.total > 0 ? 3 : 0,
                      }}
                    />

                    <span className="dashboard-chart-label">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-history">
        <div className="dashboard-section-head">
          <div>
            <h2>Últimos escaneamentos</h2>
            <p>
              Histórico recente de leituras com alertas
              de alérgenos
            </p>
          </div>
        </div>

        <div className="history-header">
          <span>Produto</span>
          <span>Paciente</span>
          <span>Data e hora</span>
          <span>Status</span>
        </div>

        {carregando ? (
          <p className="history-empty">
            Carregando histórico...
          </p>
        ) : !dados ? (
          <p className="history-empty">
            Não foi possível carregar o histórico.
          </p>
        ) : dados.ultimosScans.length === 0 ? (
          <p className="history-empty">
            Nenhum escaneamento de paciente vinculado
            disponível.
          </p>
        ) : (
          dados.ultimosScans.map((scan) => (
            <div
              className="history-header"
              key={scan.id}
            >
              <span>{scan.nomeProduto}</span>
              <span>{scan.paciente}</span>
              <span>{formatarData(scan.data)}</span>

              <span
                className={`scan-status ${
                  scan.veredito === "PERIGOSO"
                    ? "scan-danger"
                    : scan.veredito === "SEGURO"
                      ? "scan-safe"
                      : "scan-unknown"
                }`}
              >
                {scan.veredito === "PERIGOSO"
                  ? "Perigoso"
                  : scan.veredito === "SEGURO"
                    ? "Seguro"
                    : "Indefinido"}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
