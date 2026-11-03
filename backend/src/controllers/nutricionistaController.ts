
import { Response } from "express";
import mongoose from "mongoose";
import { NutricionistaMongo } from "../models/NutricionistaMongo.js";
import { RequisicaoAutenticada } from "../middlewares/autenticarNutricionista.js";

function normalizarCRN(crn: string): string {
  return crn.trim().toUpperCase().replace(/\s+/g, " ");
}

export async function obterMeuPerfil(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const id = req.nutricionistaId;

    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(401).json({
        mensagem: "Identificação inválida.",
      });
      return;
    }

    const nutricionista = await NutricionistaMongo.findById(id)
      .select("nome email crn");

    if (!nutricionista) {
      res.status(404).json({
        mensagem: "Nutricionista não encontrado.",
      });
      return;
    }

    res.json({
      nutricionista: {
        id: nutricionista._id.toString(),
        nome: nutricionista.nome,
        email: nutricionista.email,
        crn: nutricionista.crn ?? "",
      },
    });
  } catch (error) {
    console.error("Erro ao consultar perfil:", error);

    res.status(500).json({
      mensagem: "Erro interno ao consultar perfil.",
    });
  }
}

export async function atualizarMeuPerfil(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const id = req.nutricionistaId;

    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(401).json({
        mensagem: "Identificação inválida.",
      });
      return;
    }

    const { nome, email, crn } = req.body ?? {};

    if (
      typeof nome !== "string" ||
      typeof email !== "string" ||
      typeof crn !== "string"
    ) {
      res.status(400).json({
        mensagem: "Nome, e-mail e CRN devem ser textos.",
      });
      return;
    }

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const crnLimpo = normalizarCRN(crn);

    if (
      !nomeLimpo ||
      nomeLimpo.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo) ||
      emailLimpo.length > 255
    ) {
      res.status(400).json({
        mensagem: "Nome ou e-mail inválido.",
      });
      return;
    }

    // Permite contas antigas sem CRN.
    // Quando informado, exige o formato completo.
    if (
      crnLimpo &&
      (
        crnLimpo.length > 40 ||
        !/^CRN[-\s]?\d{1,2}\s+\d{3,10}$/.test(crnLimpo)
      )
    ) {
      res.status(400).json({
        mensagem: "CRN inválido. Exemplo: CRN-3 12345.",
      });
      return;
    }

    const crnExistente = crnLimpo
      ? await NutricionistaMongo.findOne({
          crn: crnLimpo,
          _id: { $ne: id },
        })
      : null;

    if (crnExistente) {
      res.status(409).json({
        mensagem: "Este CRN já está cadastrado.",
      });
      return;
    }

    const alteracoes: Record<string, unknown> = {
      nome: nomeLimpo,
      email: emailLimpo,
    };

    // Não salva string vazia como CRN.
    const atualizacao = crnLimpo
      ? {
          $set: { ...alteracoes, crn: crnLimpo },
        }
      : {
          $set: alteracoes,
          $unset: { crn: "" },
        };

    const nutricionista =
      await NutricionistaMongo.findByIdAndUpdate(
        id,
        atualizacao,
        {
          new: true,
          runValidators: true,
        }
      ).select("nome email crn");

    if (!nutricionista) {
      res.status(404).json({
        mensagem: "Nutricionista não encontrado.",
      });
      return;
    }

    res.json({
      mensagem: "Perfil atualizado com sucesso!",
      nutricionista: {
        id: nutricionista._id.toString(),
        nome: nutricionista.nome,
        email: nutricionista.email,
        crn: nutricionista.crn ?? "",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        mensagem: "E-mail ou CRN já cadastrado.",
      });
      return;
    }

    console.error("Erro ao atualizar perfil:", error);

    res.status(500).json({
      mensagem: "Erro interno ao atualizar perfil.",
    });
  }
}
