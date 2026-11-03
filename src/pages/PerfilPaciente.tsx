
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  UsersRound,
  ArrowLeft,
  ShieldAlert,
  ScanLine,
} from "lucide-react";

import {
  buscarPacientePorId,
  type DetalhesPaciente,
} from "../services/pacienteService";

function formatarItens(itens: unknown[]): string {
  if (!Array.isArray(itens) || itens.length === 0) {
    return "Não informado";
  }

  return itens
    .map((item) => {
      if (typeof item === "string") return item;

      if (item && typeof item === "object") {
        const dados = item as Record<string, unknown>;

        if (typeof dados.nome === "string") {
          return dados.nome;
        }

        if (typeof dados.tipo === "string") {
          return dados.tipo;
        }
      }

      return "Item cadastrado";
    })
    .join(", ");
}

function formatarSensibilidade(
  valores: Record<string, unknown>
): string {
  const entradas = Object.entries(valores ?? {});

  if (entradas.length === 0) {
    return "Não informado";
  }

  return entradas
    .map(([restricao, nivel]) => `${restricao}: ${String(nivel)}`)
    .join(" • ");
}

export default function PerfilPaciente() {
  const { id } = useParams<{ id: string }>();

  const [dados, setDados] = useState<DetalhesPaciente | null>(
    null
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  
useEffect(() => {
  let ativo = true;

  setDados(null);
  setErro("");
  setCarregando(true);

  if (!id) {
    setErro("Paciente não informado.");
    setCarregando(false);
    return;
  }

  buscarPacientePorId(id)
    .then((resposta) => {
      if (ativo) {
        setDados(resposta);
      }
    })
    .catch((error) => {
      if (ativo) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar paciente."
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
}, [id]);



  if (carregando) {
    return (
      <div className="page-heading">
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
          <p className="notice">
            {erro || "Paciente não encontrado."}
          </p>

          <Link to="/pacientes">
            <ArrowLeft size={16} /> Voltar aos pacientes
          </Link>
        </div>
      </>
    );
  }

  const { paciente, scans } = dados;

  return (
    <>
      <div className="page-heading">
        <Link to="/pacientes">
          <ArrowLeft size={16} /> Voltar aos pacientes
        </Link>

        <h1>{paciente.nome}</h1>
        <p>Informações e histórico individual do paciente.</p>
      </div>

      <div className="panel">
        <h2>
          <UsersRound size={20} /> Dados do paciente
        </h2>

        <p>
          <strong>Nome:</strong> {paciente.nome}
        </p>

        <p>
          <strong>E-mail:</strong> {paciente.email || "Não informado"}
        </p>

        <p>
          <strong>Restrições alimentares:</strong>{" "}
          {formatarItens(paciente.restricoes)}
        </p>

        <p>
          <strong>Níveis de sensibilidade:</strong>{" "}
          {formatarSensibilidade(paciente.niveisSensibilidade)}
        </p>
      </div>

      <div className="panel">
        <h2>
          <ScanLine size={20} /> Histórico de escaneamentos
        </h2>

        {scans.length === 0 ? (
          <div className="empty">
            <ScanLine size={35} />
            Nenhum scan registrado para este paciente.
          </div>
        ) : (
          <div className="patients-table-wrap">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Data</th>
                  <th>Resultado</th>
                </tr>
              </thead>

              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id}>
                    <td>{scan.nomeProduto}</td>

                    <td>
                      {new Date(scan.createdAt).toLocaleString(
                        "pt-BR",
                        {
                          timeZone: "America/Sao_Paulo",
                        }
                      )}
                    </td>

                    <td>
                      {scan.veredito === "PERIGOSO" ? (
                        <span>
                          <ShieldAlert
                            size={15}
                            color="#d64545"
                          />{" "}
                          Perigoso
                        </span>
                      ) : scan.veredito === "SEGURO" ? (
                        "Seguro"
                      ) : (
                        "Indefinido"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
