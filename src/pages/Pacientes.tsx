
import "../styles/pacientes.css";

import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";

import {
  buscarPacientes,
  type Paciente,
} from "../services/pacienteService";

type Ordem = "asc" | "desc";

function obterNomesRestricoes(restricoes: unknown): string[] {
  if (!Array.isArray(restricoes)) {
    return [];
  }

  return restricoes
    .map((restricao): string | null => {
      if (typeof restricao === "string") {
        return restricao.trim();
      }

      if (
        restricao &&
        typeof restricao === "object" &&
        "nome" in restricao &&
        typeof restricao.nome === "string"
      ) {
        return restricao.nome.trim();
      }

      return null;
    })
    .filter(
      (nome): nome is string =>
        nome !== null && nome.length > 0
    );
}

function formatarRestricoes(restricoes: unknown): string {
  const nomes = obterNomesRestricoes(restricoes);

  return nomes.length > 0
    ? nomes.join(", ")
    : "Não informada";
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export default function Pacientes() {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("asc");
  const [lista, setLista] = useState<Paciente[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroRestricao, setFiltroRestricao] =
    useState("todas");

  const [pagina, setPagina] = useState(1);

  const itensPorPagina = 10;

  useEffect(() => {
    let ativo = true;

    buscarPacientes()
      .then((pacientes) => {
        if (!ativo) return;

        setLista(pacientes);
        setErro("");
      })
      .catch((error) => {
        if (!ativo) return;

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar pacientes."
        );
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

  const restricoesDisponiveis = useMemo(() => {
    const restricoes = lista.flatMap((paciente) =>
      obterNomesRestricoes(paciente.restricoes)
    );

    const unicas = new Map<string, string>();

    restricoes.forEach((restricao) => {
      const chave = normalizarTexto(restricao);

      if (!unicas.has(chave)) {
        unicas.set(chave, restricao);
      }
    });

    return [...unicas.values()].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [lista]);

  const pacientes = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return lista
      .filter((paciente) => {
        const restricoes = obterNomesRestricoes(
          paciente.restricoes
        );

        const textoPesquisa = normalizarTexto(
          [paciente.nome, ...restricoes].join(" ")
        );

        const correspondeBusca =
          !buscaNormalizada ||
          textoPesquisa.includes(buscaNormalizada);

        const correspondeRestricao =
          filtroRestricao === "todas" ||
          restricoes.some(
            (restricao) =>
              normalizarTexto(restricao) ===
              normalizarTexto(filtroRestricao)
          );

        return correspondeBusca && correspondeRestricao;
      })
      .sort((a, b) =>
        ordem === "asc"
          ? a.nome.localeCompare(b.nome, "pt-BR")
          : b.nome.localeCompare(a.nome, "pt-BR")
      );
  }, [lista, busca, ordem, filtroRestricao]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(pacientes.length / itensPorPagina)
  );

  const paginaAtual = Math.min(pagina, totalPaginas);

  const pacientesPaginados = pacientes.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const possuiFiltros =
    busca.trim().length > 0 ||
    filtroRestricao !== "todas";

  function mensagemListaVazia(): string {
    if (lista.length === 0) {
      return "Nenhum paciente vinculado à sua conta.";
    }

    if (possuiFiltros) {
      return "Nenhum paciente corresponde aos filtros selecionados.";
    }

    return "Nenhum paciente encontrado.";
  }

  return (
    <div className="patients-page">
      <div className="patients-title">
        <h1>Seus pacientes</h1>

        <label className="patients-search">
          <Search size={16} />

          <input
            type="search"
            value={busca}
            onChange={(event) => {
              setBusca(event.target.value);
              setPagina(1);
            }}
            placeholder="Buscar pacientes"
            aria-label="Buscar pacientes"
          />
        </label>
      </div>

      <div className="patients-filters">
        <label htmlFor="filtro-restricao">
          Filtrar por restrição
        </label>

        <select
          id="filtro-restricao"
          value={filtroRestricao}
          onChange={(event) => {
            setFiltroRestricao(event.target.value);
            setPagina(1);
          }}
        >
          <option value="todas">
            Todas as restrições
          </option>

          {restricoesDisponiveis.map((restricao) => (
            <option
              key={normalizarTexto(restricao)}
              value={restricao}
            >
              {restricao}
            </option>
          ))}
        </select>
      </div>

      {erro && (
        <div
          className="demo-disclaimer"
          role="alert"
        >
          {erro}
        </div>
      )}

      <div className="patients-table-wrap">
        <table className="patients-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={
                ordem === "asc" ? "ascending" : "descending"
              }>
                <button
                  type="button"
                  onClick={() => {
                    setOrdem((atual) =>
                      atual === "asc" ? "desc" : "asc"
                    );
                    setPagina(1);
                  }}
                  aria-label={
                    ordem === "asc"
                      ? "Ordenar nomes de Z a A"
                      : "Ordenar nomes de A a Z"
                  }
                >
                  Nome
                  <ChevronDown
                    size={14}
                    style={{
                      transform:
                        ordem === "asc"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  />
                </button>
              </th>

              <th scope="col">Intolerância</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>

          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={3}>
                  Carregando pacientes...
                </td>
              </tr>
            ) : erro ? (
              <tr>
                <td colSpan={3}>
                  Não foi possível carregar a lista
                  de pacientes.
                </td>
              </tr>
            ) : pacientes.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  {mensagemListaVazia()}
                </td>
              </tr>
            ) : (
              pacientesPaginados.map((paciente) => (
                <tr key={paciente.id}>
                  <td>
                    <NavLink
                      to={`/pacientes/${paciente.id}`}
                    >
                      {paciente.nome}
                    </NavLink>
                  </td>

                  <td>
                    {formatarRestricoes(
                      paciente.restricoes
                    )}
                  </td>

                  <td>
                    <NavLink
                      to={`/pacientes/${paciente.id}`}
                      className="patient-view-button"
                      aria-label={`Ver perfil de ${paciente.nome}`}
                    >
                      Ver perfil
                    </NavLink>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!carregando &&
        !erro &&
        pacientes.length > 0 && (
          <div className="patients-pagination">
            <span>
              Página {paginaAtual} de {totalPaginas}
            </span>

            <div>
              <button
                type="button"
                disabled={paginaAtual === 1}
                onClick={() =>
                  setPagina(paginaAtual - 1)
                }
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={
                  paginaAtual === totalPaginas
                }
                onClick={() =>
                  setPagina(paginaAtual + 1)
                }
              >
                Próxima
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
