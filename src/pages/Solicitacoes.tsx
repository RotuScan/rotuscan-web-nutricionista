
import { useEffect, useMemo, useState } from "react";
import { Search, Check, X, RefreshCw } from "lucide-react";

import "../styles/pacientes.css";
import "../styles/solicitacoes.css";

import {
  buscarSolicitacoes,
  aprovarSolicitacao,
  recusarSolicitacao,
  type SolicitacaoVinculo,
} from "../services/vinculacaoService";

export default function Solicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState<
    SolicitacaoVinculo[]
  >([]);

  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarSolicitacoes() {
    setCarregando(true);
    setErro("");

    try {
      const dados = await buscarSolicitacoes();
      setSolicitacoes(dados);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar solicitações."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarSolicitacoes();
  }, []);

  const listaFiltrada = useMemo(() => {
    const termo = busca
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();

    return solicitacoes.filter((solicitacao) =>
      (solicitacao.nomePaciente ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .includes(termo)
    );
  }, [solicitacoes, busca]);

  async function executarAcao(
    id: string,
    acao: "aprovar" | "recusar"
  ) {
    if (processandoId) return;

    const solicitacao = solicitacoes.find(
      (item) => item.id === id
    );

    if (!solicitacao) return;

    const confirmou = window.confirm(
      acao === "aprovar"
        ? `Deseja aprovar o vínculo de ${solicitacao.nomePaciente}?`
        : `Deseja recusar o vínculo de ${solicitacao.nomePaciente}?`
    );

    if (!confirmou) return;

    setProcessandoId(id);
    setErro("");
    setMensagem("");

    try {
      if (acao === "aprovar") {
        await aprovarSolicitacao(id);
      } else {
        await recusarSolicitacao(id);
      }

      setMensagem(
        acao === "aprovar"
          ? "Solicitação aprovada com sucesso!"
          : "Solicitação recusada com sucesso!"
      );

      setSolicitacoes((lista) =>
        lista.filter((item) => item.id !== id)
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível processar a solicitação."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  function formatarData(data: string) {
    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return "Data não informada";
    }

    return valor.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="patients-page solicitacoes-page">
      <div className="patients-title">
        <div>
          <h1>Solicitações de vínculo</h1>
          <p className="solicitacoes-subtitulo">
            Gerencie os pacientes que solicitaram
            acompanhamento nutricional.
          </p>
        </div>

        <label className="patients-search">
          <Search size={16} />

          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Buscar solicitações"
            aria-label="Buscar solicitações"
          />
        </label>
      </div>

      <div className="solicitacoes-resumo">
        <span>
          <strong>{solicitacoes.length}</strong>{" "}
          solicitações pendentes
        </span>

        <button
          type="button"
          className="solicitacoes-atualizar"
          onClick={() => void carregarSolicitacoes()}
          disabled={carregando || processandoId !== null}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {erro && (
        <div className="demo-disclaimer" role="alert">
          {erro}
        </div>
      )}

      {mensagem && (
        <p className="solicitacoes-sucesso" role="status">
          {mensagem}
        </p>
      )}

      <div className="patients-table-wrap">
        <table className="patients-table">
          <thead>
            <tr>
              <th scope="col">Paciente</th>
              <th scope="col">Data da solicitação</th>
              <th scope="col">Status</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>

          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={4}>
                  Carregando solicitações...
                </td>
              </tr>
            ) : erro && solicitacoes.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  Não foi possível carregar as solicitações.
                </td>
              </tr>
            ) : listaFiltrada.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  {busca.trim()
                    ? "Nenhuma solicitação corresponde à busca."
                    : "Nenhuma solicitação pendente no momento."}
                </td>
              </tr>
            ) : (
              listaFiltrada.map((solicitacao) => (
                <tr key={solicitacao.id}>
                  <td>
                    {solicitacao.nomePaciente ||
                      "Paciente sem nome"}
                  </td>

                  <td>
                    {formatarData(solicitacao.createdAt)}
                  </td>

                  <td>
                    <span className="solicitacoes-status">
                      Pendente
                    </span>
                  </td>

                  <td>
                    <div className="solicitacoes-acoes">
                      <button
                        type="button"
                        className="solicitacoes-aprovar"
                        disabled={processandoId !== null}
                        onClick={() =>
                          void executarAcao(
                            solicitacao.id,
                            "aprovar"
                          )
                        }
                      >
                        <Check size={15} />
                        Aprovar
                      </button>

                      <button
                        type="button"
                        className="solicitacoes-recusar"
                        disabled={processandoId !== null}
                        onClick={() =>
                          void executarAcao(
                            solicitacao.id,
                            "recusar"
                          )
                        }
                      >
                        <X size={15} />
                        Recusar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
