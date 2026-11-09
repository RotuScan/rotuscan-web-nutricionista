
import { api } from "./api";

export interface MensagemChat {
  _id: string;
  pacienteId: string;
  nutricionistaId: string;
  remetenteTipo: "PACIENTE" | "NUTRICIONISTA";
  texto: string;
  lidaEm: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RespostaMensagens {
  mensagens: MensagemChat[];
}

interface RespostaEnvio {
  mensagem: MensagemChat;
}

interface RespostaLeitura {
  sucesso: boolean;
  atualizadas: number;
}

export async function listarMensagensChat(
  pacienteId: string
): Promise<MensagemChat[]> {
  const resposta = await api<RespostaMensagens>(
    `/api/chat/pacientes/${encodeURIComponent(pacienteId)}/mensagens`
  );

  return resposta.mensagens;
}

export async function enviarMensagemChat(
  pacienteId: string,
  texto: string
): Promise<MensagemChat> {
  const resposta = await api<RespostaEnvio>(
    `/api/chat/pacientes/${encodeURIComponent(pacienteId)}/mensagens`,
    {
      method: "POST",
      body: JSON.stringify({ texto }),
    }
  );

  return resposta.mensagem;
}

export async function marcarMensagensChatLidas(
  pacienteId: string
): Promise<number> {
  const resposta = await api<RespostaLeitura>(
    `/api/chat/pacientes/${encodeURIComponent(pacienteId)}/mensagens/lidas`,
    {
      method: "PATCH",
    }
  );

  return resposta.atualizadas;
}
