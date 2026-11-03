
import "../styles/dashboard.css";

import { useEffect, useMemo, useState } from "react";
import {
  UsersRound,
  Bell,
  ScanLine,
  AlertCircle,
} from "lucide-react";

import {
  buscarDashboard,
  type DadosDashboard,
} from "../services/dashboardService";

type Periodo = 1 | 7 | 30;

function dataLocal(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

function montarGrafico(
  registros: DadosDashboard["scansPorDia"],
  periodo: Periodo
) {
  const totais = new Map(
    registros.map((registro) => [registro.data, registro.total])
  );

  const hoje = new Date();

  return Array.from({ length: periodo }, (_, indice) => {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - (periodo - indice - 1));

    const chave = dataLocal(data);

    return {
      data: chave,
      label: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).format(data),
      total: totais.get(chave) ?? 0,
    };
  });
}

export default function Dashboard() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>(7);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    buscarDashboard()
      .then((resposta) => {
        if (ativo) setDados(resposta);
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
        if (ativo) setCarregando(false);
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

  function formatarData(data: string) {
    return new Date(data).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="dashboard-page">
      {erro && (
        <p role="alert" className="demo-disclaimer">
          <AlertCircle size={16} /> {erro}
        </p>
      )}

      <div className="dashboard-stats">
        <article>
          <span>Total de pacientes</span>
          <strong>
            {carregando ? "..." : dados?.totalPacientes ?? "—"}
          </strong>
          <small>Pacientes vinculados</small>
          <UsersRound className="metric-icon green" size={25} />
        </article>

        <article>
          <span>Alertas recentes</span>
          <strong>
            {carregando ? "..." : dados?.alertasRecentes ?? "—"}
          </strong>
          <small>Scans perigosos nos últimos 7 dias</small>
          <Bell className="metric-icon red" size={25} />
        </article>

        <article>
          <span>Scans realizados</span>
          <strong>
            {carregando ? "..." : dados?.totalScans ?? "—"}
          </strong>
          <small>Total de leituras registradas</small>
          <ScanLine className="metric-icon blue" size={25} />
        </article>
      </div>

      <section className="dashboard-chart">
        <div className="dashboard-section-head">
          <div>
            <h2>Scans realizados</h2>
            <p>Frequência de diagnósticos e leituras</p>
          </div>

          <div className="period-tabs">
            {([
              [1, "Hoje"],
              [7, "Últimos 7 dias"],
              [30, "Últimos 30 dias"],
            ] as const).map(([valor, titulo]) => (
              <button
                key={valor}
                type="button"
                className={periodo === valor ? "selected" : ""}
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
            <p>Não foi possível carregar os dados.</p>
          </div>
        ) : grafico.every((item) => item.total === 0) ? (
          <div className="chart-empty">
            <ScanLine size={40} />
            <p>Nenhum scan registrado neste período.</p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 240,
              padding: "20px 12px",
              overflowX: "auto",
            }}
          >
            {grafico.map((item) => (
              <div
                key={item.data}
                title={`${item.label}: ${item.total} scans`}
                style={{
                  flex: periodo === 30 ? "0 0 24px" : 1,
                  minWidth: 24,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 6,
                }}
              >
                <small>{item.total}</small>

                <div
                  style={{
                    width: "75%",
                    minHeight: item.total ? 3 : 0,
                    height: `${(item.total / maiorValor) * 80}%`,
                    background: "#2e9c70",
                    borderRadius: "6px 6px 0 0",
                  }}
                />

                <small
                  style={{
                    fontSize: 10,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-history">
        <div className="dashboard-section-head">
          <div>
            <h2>Últimos escaneamentos</h2>
            <p>Histórico recente de leituras com alertas de alérgenos</p>
          </div>
        </div>

        <div className="history-header">
          <span>Produto</span>
          <span>Paciente</span>
          <span>Data e hora</span>
          <span>Status</span>
        </div>

        {carregando ? (
          <p className="history-empty">Carregando histórico...</p>
      ) : !dados ? (
  <p className="history-empty">
    Não foi possível carregar o histórico.
  </p>
) : dados.ultimosScans.length === 0 ? (
          <p className="history-empty">
            Nenhum escaneamento de paciente vinculado disponível.
          </p>
        ) : (
          dados.ultimosScans.map((scan) => (
            <div className="history-header" key={scan.id}>
              <span>{scan.nomeProduto}</span>
              <span>{scan.paciente}</span>
              <span>{formatarData(scan.data)}</span>
              <span>
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
