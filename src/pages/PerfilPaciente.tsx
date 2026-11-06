
import "../styles/pacientes.css";
import "../styles/perfilPaciente.css";

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  UsersRound,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  CircleHelp,
  ScanLine,
  X,
} from "lucide-react";

import {
  buscarPacientePorId,
  type DetalhesPaciente,
  type ScanPaciente,
} from "../services/pacienteService";

function formatarItens(itens: unknown): string {
  if (!Array.isArray(itens) || itens.length === 0) {
    return "Não informado";
  }

  const nomes = itens
    .map((item): string | null => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const dados = item as Record<string, unknown>;

        if (typeof dados.nome === "string") {
          return dados.nome.trim();
        }

        if (typeof dados.tipo === "string") {
          return dados.tipo.trim();
        }
      }

      return null;
    })
    .filter(
      (nome): nome is string =>
        nome !== null && nome.length > 0
    );

  return nomes.length > 0
    ? nomes.join(", ")
    : "Não informado";
}

function formatarSensibilidade(
  valores: Record<string, unknown> | null | undefined
): string {
  if (!valores || typeof valores !== "object") {
    return "Não informado";
  }

  const entradas = Object.entries(valores).filter(
    ([, nivel]) => nivel !== null && nivel !== undefined
  );

  if (entradas.length === 0) {
    return "Não informado";
  }

  return entradas
    .map(([restricao, nivel]) => {
      const valor =
        typeof nivel === "string" ||
          typeof nivel === "number"
          ? String(nivel)
          : "Não informado";

      return `${restricao}: ${valor}`;
    })
    .join(" • ");
}

function formatarData(data: string): string {
  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "Data não informada";
  }

  return dataConvertida.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obterResultado(scan: ScanPaciente) {
  if (scan.veredito === "PERIGOSO") {
    return {
      texto: "Perigoso",
      classe: "scan-result-danger",
      Icone: ShieldAlert,
    };
  }

  if (scan.veredito === "SEGURO") {
    return {
      texto: "Seguro",
      classe: "scan-result-safe",
      Icone: ShieldCheck,
    };
  }

  return {
    texto: "Indefinido",
    classe: "scan-result-unknown",
    Icone: CircleHelp,
  };
}

export default function PerfilPaciente() {
  const { id } = useParams<{ id: string }>();

  return <ConteudoPerfilPaciente key={id ?? "sem-id"} id={id} />;
}

function ConteudoPerfilPaciente({ id }: { id?: string }) {
  const [dados, setDados] =
    useState<DetalhesPaciente | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [scanSelecionado, setScanSelecionado] =
    useState<ScanPaciente | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const botaoAnteriorRef = useRef<HTMLElement | null>(null);



  useEffect(() => {
    let ativo = true;

    if (!id) {
      return;
    }

    buscarPacientePorId(id)
      .then((resposta) => {
        if (!ativo) return;

        setDados(resposta);
        setErro("");
        setCarregando(false);
      })
      .catch((error) => {
        if (!ativo) return;

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar paciente."
        );
        setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id]);



  useEffect(() => {
    if (!scanSelecionado) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focoAnterior =
      botaoAnteriorRef.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const obterElementos = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

    const elementos = obterElementos();
    (elementos[0] ?? modal).focus();

    function controlarTeclado(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setScanSelecionado(null);
        return;
      }

      if (event.key !== "Tab") return;

      const itens = obterElementos();
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];

      if (!primeiro || !ultimo) {
        event.preventDefault();
        modal?.focus();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === primeiro ||
          !modal?.contains(document.activeElement))
      ) {
        event.preventDefault();
        ultimo.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === ultimo ||
          !modal?.contains(document.activeElement))
      ) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", controlarTeclado);

    return () => {
      document.removeEventListener(
        "keydown",
        controlarTeclado
      );

      document.body.style.overflow = overflowAnterior;

      if (focoAnterior?.isConnected) {
        focoAnterior.focus();
      }
    };
  }, [scanSelecionado]);

  if (carregando) {
    return (
      <div className="page-heading" role="status">
        <h1>Perfil do paciente</h1>
        <p>Carregando informações...</p>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <>
        <div className="page-heading">
          <h1>Perfil do paciente</h1>
        </div>

        <div className="panel">
          <p className="notice" role="alert">
            {erro || "Paciente não encontrado."}
          </p>

          <Link to="/pacientes">
            <ArrowLeft size={16} />
            Voltar aos pacientes
          </Link>
        </div>
      </>
    );
  }

  const { paciente, scans } = dados;

   const scansNoHistorico = scans.length;

  const totalAlertas = scans.filter(
    (scan) => scan.veredito === "PERIGOSO"
  ).length;

  const totalSeguros = scans.filter(
    (scan) => scan.veredito === "SEGURO"
  ).length;

  return (
    <>
      <div className="page-heading">
        <Link to="/pacientes">
          <ArrowLeft size={16} />
          Voltar aos pacientes
        </Link>

        <h1>{paciente.nome}</h1>

        <p>
          Informações e histórico individual do paciente.
        </p>
      </div>


      <section className="panel">
        <h2>
          <UsersRound size={20} />
          Dados do paciente
        </h2>

        <div className="perfil-paciente-dados">
          <div className="perfil-paciente-campo">
            <strong>Nome</strong>
            <span>{paciente.nome}</span>
          </div>

          <div className="perfil-paciente-campo">
            <strong>E-mail</strong>
            <span>{paciente.email || "NÃ£o informado"}</span>
          </div>

          <div className="perfil-paciente-campo">
            <strong>Restrições alimentares</strong>
            <span>{formatarItens(paciente.restricoes)}</span>
          </div>

          <div className="perfil-paciente-campo">
            <strong>Ní­veis de sensibilidade</strong>
            <span>
              {formatarSensibilidade(paciente.niveisSensibilidade)}
            </span>
          </div>
        </div>
      </section>


      <div className="patient-stats">
        <div className="patient-stat-card">
          <ScanLine size={22} color="#176b49" />

          <span>Scans no histÃ³rico</span>
          <strong>{scansNoHistorico}</strong>
        </div>

        <div className="patient-stat-card">
          <ShieldAlert size={22} color="#d64545" />

          <span>Alertas identificados</span>
          <strong>{totalAlertas}</strong>
        </div>

        <div className="patient-stat-card">
          <ShieldCheck size={22} color="#16865b" />

          <span>Scans seguros</span>
          <strong>{totalSeguros}</strong>
        </div>
      </div>

      <section className="panel">
        <h2>
          <ScanLine size={20} />
          HistÃ³rico de escaneamentos
        </h2>

        {scans.length === 0 ? (
          <div className="empty">
            <ScanLine size={35} />
            <p>
              Nenhum scan registrado para este paciente.
            </p>
          </div>
        ) : (
          <div className="patients-table-wrap">
            <table className="patients-table">
              <thead>
                <tr>
                  <th scope="col">Produto</th>
                  <th scope="col">Data</th>
                  <th scope="col">Resultado</th>
                  <th scope="col">AÃ§Ãµes</th>
                </tr>
              </thead>

              <tbody>
                {scans.map((scan) => {
                  const resultado = obterResultado(scan);
                  const Icone = resultado.Icone;

                  return (
                    <tr key={scan.id}>
                      <td>
                        {scan.nomeProduto ||
                          "Produto nÃ£o informado"}
                      </td>

                      <td>
                        {formatarData(scan.createdAt)}
                      </td>

                      <td>
                        <span
                          className={`scan-result ${resultado.classe}`}
                        >
                          <Icone size={15} />
                          {resultado.texto}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="scan-details-button"
                          onClick={(event) => {
                            botaoAnteriorRef.current =
                              event.currentTarget;

                            setScanSelecionado(scan);
                          }}
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {scanSelecionado && (
        <div
          className="scan-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setScanSelecionado(null);
            }
          }}
        >
          <div
            className="scan-modal"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-modal-title"
          >
            <div className="scan-modal-header">
              <h2 id="scan-modal-title">
                Detalhes do escaneamento
              </h2>

              <button
                type="button"
                onClick={() => setScanSelecionado(null)}
                aria-label="Fechar detalhes"
              >
                <X size={20} />
              </button>
            </div>

            <div className="scan-modal-content">
              <p>
                <strong>Produto:</strong>{" "}
                {scanSelecionado.nomeProduto ||
                  "NÃ£o informado"}
              </p>

              <p>
                <strong>Data:</strong>{" "}
                {formatarData(
                  scanSelecionado.createdAt
                )}
              </p>

              <p>
                <strong>Resultado:</strong>{" "}
                {obterResultado(scanSelecionado).texto}
              </p>

              <div className="scan-modal-section">
                <h3>IntolerÃ¢ncias detectadas</h3>

                <p>
                  {formatarItens(
                    scanSelecionado.intoleranciaDetectada
                  )}
                </p>
              </div>

              <div className="scan-modal-section">
                <h3>AlÃ©rgenos detectados</h3>

                <p>
                  {formatarItens(
                    scanSelecionado.alergicosDetectados
                  )}
                </p>
              </div>
            </div>

            <div className="scan-modal-footer">
              <button
                type="button"
                onClick={() =>
                  setScanSelecionado(null)
                }
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
