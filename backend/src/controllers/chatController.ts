
import { Response } from "express";
import mongoose from "mongoose";
import { Mensagem } from "../models/Mensagem.js";
import { SolicitacaoVinculo } from "../models/SolicitacaoVinculo.js";
import type { RequisicaoAutenticada } from "../middlewares/autenticarNutricionista.js";

async function obterConversa(
  req: RequisicaoAutenticada,
  res: Response
) {
  const nutricionistaId = req.nutricionistaId;
  const pacienteId = req.params.pacienteId;

  if (!nutricionistaId || !mongoose.isValidObjectId(nutricionistaId)) {
    res.status(401).json({
      mensagem: "Nutricionista não autenticado.",
    });
    return null;
  }

  if (typeof pacienteId !== "string" || !mongoose.isValidObjectId(pacienteId)) {
    res.status(400).json({
      mensagem: "ID do paciente inválido.",
    });
    return null;
  }

  const db = mongoose.connection.db;

  if (!db) {
    res.status(503).json({
      mensagem: "Banco de dados indisponível.",
    });
    return null;
  }

  const pacienteObjectId = new mongoose.Types.ObjectId(pacienteId);
  const nutricionistaObjectId = new mongoose.Types.ObjectId(nutricionistaId);

  // Verifica o vínculo atual na coleção compartilhada com o Mobile.
  const paciente = await db.collection("users").findOne({
    _id: pacienteObjectId,
    role: "PACIENTE",
    nutricionistaId: nutricionistaObjectId,
  });

  if (!paciente) {
    res.status(403).json({
      mensagem: "Este paciente não está vinculado a você.",
    });
    return null;
  }

  // Confirma que existe uma solicitação de vínculo aprovada.
  const solicitacao = await SolicitacaoVinculo.findOne({
    pacienteId: pacienteObjectId,
    nutricionistaId: nutricionistaObjectId,
    status: "APROVADO",
    encerradaEm: null,
  }).lean();

  if (!solicitacao) {
    res.status(403).json({
      mensagem: "Não existe um vínculo ativo aprovado com este paciente.",
    });
    return null;
  }

  return {
    pacienteId: pacienteObjectId,
    nutricionistaId: nutricionistaObjectId,
  };
}

export async function listarMensagens(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const conversa = await obterConversa(req, res);
    if (!conversa) return;

    const mensagens = await Mensagem.find(conversa)
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean();

    res.json({ mensagens: mensagens.reverse() });
  } catch (error) {
    console.error("Erro ao listar mensagens:", error);
    res.status(500).json({
      mensagem: "Erro interno ao consultar mensagens.",
    });
  }
}

export async function enviarMensagem(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const conversa = await obterConversa(req, res);
    if (!conversa) return;

    if (typeof req.body?.texto !== "string") {
      res.status(400).json({
        mensagem: "O texto da mensagem é obrigatório.",
      });
      return;
    }

    const texto = req.body.texto.trim();

    if (!texto || texto.length > 2000) {
      res.status(400).json({
        mensagem: "A mensagem deve conter entre 1 e 2000 caracteres.",
      });
      return;
    }

    const mensagem = await Mensagem.create({
      ...conversa,
      remetenteTipo: "NUTRICIONISTA",
      texto,
    });

    res.status(201).json({ mensagem });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({
      mensagem: "Erro interno ao enviar mensagem.",
    });
  }
}

export async function marcarMensagensLidas(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const conversa = await obterConversa(req, res);
    if (!conversa) return;

    const resultado = await Mensagem.updateMany(
      {
        ...conversa,
        remetenteTipo: "PACIENTE",
        lidaEm: null,
      },
      {
        $set: { lidaEm: new Date() },
      }
    );

    res.json({
      sucesso: true,
      atualizadas: resultado.modifiedCount,
    });
  } catch (error) {
    console.error("Erro ao marcar mensagens como lidas:", error);
    res.status(500).json({
      mensagem: "Erro interno ao atualizar mensagens.",
    });
  }
}
