
import { useEffect, useRef, useState } from "react";
import "../styles/Mensagens.css";
import {
  MessageCircle,
  Search,
  Send,
  UserRound,
  LoaderCircle,
} from "lucide-react";

import { buscarPacientes, type Paciente } from "../services/pacienteService";
import {
  listarMensagensChat,
  enviarMensagemChat,
  marcarMensagensChatLidas,
  type MensagemChat,
} from "../services/chatService";


export default function Mensagens() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [busca, setBusca] = useState("");
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const fimConversaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;

    buscarPacientes()
      .then((lista) => {
        if (!ativo) return;
        setPacientes(lista);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
  if (!pacienteSelecionado) {
    return;
  }

    const pacienteId = pacienteSelecionado.id;
    let ativo = true;

    async function carregarMensagens() {
      try {
        const lista = await listarMensagensChat(pacienteId);

        if (!ativo) return;

        setMensagens(lista);
        setErro("");

        if (lista.some((mensagem) =>
          mensagem.remetenteTipo === "PACIENTE" && !mensagem.lidaEm
        )) {
          await marcarMensagensChatLidas(pacienteId);
        }
      } catch (error) {
        if (ativo) {
          setErro(error instanceof Error ? error.message : "Erro ao carregar conversa.");
        }
      } finally {
        if (ativo) setCarregandoMensagens(false);
      }
    }

        void carregarMensagens();

        const intervalo = window.setInterval(() => {
        void carregarMensagens();
        }, 5000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [pacienteSelecionado]);

  useEffect(() => {
    fimConversaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviarMensagem(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!pacienteSelecionado || !texto.trim() || enviando) return;

    const pacienteId = pacienteSelecionado.id;
    const conteudo = texto.trim();

    setEnviando(true);
    setErro("");

    try {
      await enviarMensagemChat(pacienteId, conteudo);
      setTexto("");

      const lista = await listarMensagensChat(pacienteId);
      setMensagens(lista);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao enviar mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  const pacientesFiltrados = pacientes.filter((paciente) =>
    paciente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  
return (
  <div className="mensagens-page">
    <div>
      <h1>Mensagens</h1>
      <p className="mensagens-subtitulo">
        Converse com seus pacientes vinculados.
      </p>
    </div>

    <div className="mensagens-layout">
      <aside className="mensagens-sidebar">
        <div className="mensagens-busca">
          <Search size={18} />
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar paciente..."
            aria-label="Buscar paciente"
          />
        </div>

        {carregando ? (
          <p style={{ padding: 16 }}>Carregando pacientes...</p>
        ) : pacientesFiltrados.length === 0 ? (
          <p style={{ padding: 16, color: "#64748b" }}>
            Nenhum paciente encontrado.
          </p>
        ) : (
          pacientesFiltrados.map((paciente) => (
            <button
              key={paciente.id}
              type="button"
              onClick={() => {
                if (pacienteSelecionado?.id === paciente.id) return;

                setMensagens([]);
                setErro("");
                setCarregandoMensagens(true);
                setPacienteSelecionado(paciente);
                }}
            >
              <div className="mensagens-avatar">
                <UserRound size={21} />
              </div>
              <span className="mensagens-paciente-nome">
                {paciente.nome}
              </span>
            </button>
          ))
        )}
      </aside>

      <section className="mensagens-conversa">
        {!pacienteSelecionado ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "#64748b",
              gap: 12,
            }}
          >
            <MessageCircle size={48} color="#16a34a" />
            <p>Selecione um paciente para iniciar a conversa.</p>
          </div>
        ) : (
          <>
            <header className="mensagens-cabecalho">
              <div className="mensagens-avatar">
                <UserRound size={21} />
              </div>

              <div>
                <strong>{pacienteSelecionado.nome}</strong>
                <span>Conversa com paciente</span>
              </div>
            </header>

            <div className="mensagens-historico">
              {carregandoMensagens && (
                <p>Carregando mensagens...</p>
              )}

              {!carregandoMensagens && mensagens.length === 0 && (
                <p style={{ textAlign: "center", color: "#64748b" }}>
                  Nenhuma mensagem nesta conversa.
                </p>
              )}

              {mensagens.map((mensagem) => {
                const minha =
                  mensagem.remetenteTipo === "NUTRICIONISTA";

                return (
                  <div
                    key={mensagem._id}
                    className={`mensagens-balao ${
                      minha ? "enviada" : "recebida"
                    }`}
                  >
                    <div className="mensagens-balao-texto">
                      {mensagem.texto}
                    </div>

                    <small className="mensagens-balao-hora">
                      {new Date(
                        mensagem.createdAt
                      ).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                );
              })}

              <div ref={fimConversaRef} />
            </div>

            {erro && (
              <p
                role="alert"
                style={{ padding: "8px 16px", color: "#dc2626" }}
              >
                {erro}
              </p>
            )}

            <form
              onSubmit={enviarMensagem}
              className="mensagens-form"
            >
              <input
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                placeholder="Digite sua mensagem..."
                maxLength={2000}
                aria-label="Mensagem"
                className="mensagens-input"
              />

              <button
                type="submit"
                disabled={enviando || !texto.trim()}
                className="mensagens-enviar"
                aria-label="Enviar mensagem"
              >
                {enviando ? (
                  <LoaderCircle size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  </div>
);

}
