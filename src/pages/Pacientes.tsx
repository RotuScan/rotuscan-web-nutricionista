
import "../styles/pacientes.css";

import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";

import {
  buscarPacientes,
  type Paciente,
} from "../services/pacienteService";

function formatarRestricoes(restricoes: unknown[]): string {
  if (!Array.isArray(restricoes) || restricoes.length === 0) {
    return "Não informada";
  }

  return restricoes
    .map((restricao) => {
      if (typeof restricao === "string") {
        return restricao;
      }

      if (
        restricao &&
        typeof restricao === "object" &&
        "nome" in restricao &&
        typeof restricao.nome === "string"
      ) {
        return restricao.nome;
      }

      return "Restrição cadastrada";
    })
    .join(", ");
}

export default function Pacientes() {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"asc" | "desc">("asc");

  const [lista, setLista] = useState<Paciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    buscarPacientes()
      .then((pacientes) => {
        if (ativo) setLista(pacientes);
      })
      .catch((error) => {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar pacientes."
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

  const pacientes = useMemo(() => {
    return lista
      .filter((paciente) => {
        const texto = [
          paciente.nome,
          formatarRestricoes(paciente.restricoes),
        ]
          .join(" ")
          .toLowerCase();

        return texto.includes(busca.toLowerCase());
      })
      .sort((a, b) =>
        ordem === "asc"
          ? a.nome.localeCompare(b.nome, "pt-BR")
          : b.nome.localeCompare(a.nome, "pt-BR")
      );
  }, [lista, busca, ordem]);

  return (
    <div className="patients-page">
      <div className="patients-title">
        <h1>Seus pacientes</h1>

        <label className="patients-search">
          <Search size={16} />

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar"
            aria-label="Buscar pacientes"
          />
        </label>
      </div>

      {erro && (
        <div className="demo-disclaimer" role="alert">
          {erro}
        </div>
      )}

      <div className="patients-table-wrap">
        <table className="patients-table">
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  onClick={() =>
                    setOrdem(ordem === "asc" ? "desc" : "asc")
                  }
                >
                  Nome <ChevronDown size={12} />
                </button>
              </th>

              <th>Intolerância</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={3}>Carregando pacientes...</td>
              </tr>
            ) : erro ? (
  <tr>
    <td colSpan={3}>
      Não foi possível carregar a lista de pacientes.
    </td>
  </tr>
) : pacientes.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  {busca
                    ? "Nenhum paciente encontrado."
                    : "Nenhum paciente vinculado à sua conta."}
                </td>
              </tr>
            ) : (
              pacientes.map((paciente) => (
                <tr key={paciente.id}>
                  <td>
                    <NavLink to={`/pacientes/${paciente.id}`}>
                      {paciente.nome}
                    </NavLink>
                  </td>

                  <td>
                    {formatarRestricoes(paciente.restricoes)}
                  </td>

                  <td>
                    <span
                      className="status-dot"
                      title="Status ainda não calculado"
                      style={{ backgroundColor: "#9ca3af" }}
                    />
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
