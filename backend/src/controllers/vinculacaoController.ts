
import { Response } from "express";
import mongoose from "mongoose";
import { Request } from "express";
import { NutricionistaMongo } from "../models/NutricionistaMongo.js";
import {
  normalizarCRN,
  validarCRN,
} from "../utils/validacaoAuth.js";

import { RequisicaoAutenticada } from "../middlewares/autenticarNutricionista.js";
import { SolicitacaoVinculo } from "../models/SolicitacaoVinculo.js";
import type { PacienteRequest } from "../middlewares/autenticarPaciente.js";

export async function listarSolicitacoes(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const nutricionistaId = req.nutricionistaId;

    if (
      !nutricionistaId ||
      !mongoose.isValidObjectId(nutricionistaId)
    ) {
      res.status(401).json({
        mensagem: "Nutricionista não autenticado.",
      });
      return;
    }

    const db = mongoose.connection.db;

    if (!db) {
      res.status(503).json({
        mensagem: "Banco de dados indisponível.",
      });
      return;
    }

    const solicitacoes = await SolicitacaoVinculo.find({
      nutricionistaId: new mongoose.Types.ObjectId(
        nutricionistaId
      ),
      status: "PENDENTE",
    })
      .sort({ createdAt: -1 })
      .lean();

    const pacientesIds = solicitacoes.map(
      (solicitacao) => solicitacao.pacienteId
    );

    const pacientes = await db
      .collection("users")
      .find({
        _id: { $in: pacientesIds },
        role: "PACIENTE",
      })
      .project({
        nome: 1,
      })
      .toArray();

    const nomesPorId = new Map(
      pacientes.map((paciente) => [
        paciente._id.toString(),
        paciente.nome ?? "Paciente sem nome",
      ])
    );

    res.json({
      total: solicitacoes.length,
      solicitacoes: solicitacoes.map((solicitacao) => ({
        id: String(solicitacao._id),
        pacienteId: solicitacao.pacienteId.toString(),
        nomePaciente:
          nomesPorId.get(solicitacao.pacienteId.toString()) ??
          "Paciente não encontrado",
        status: solicitacao.status,
        createdAt: solicitacao.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar solicitações:", error);

    res.status(500).json({
      mensagem: "Erro interno ao listar solicitações.",
    });
  }
}



export async function recusarSolicitacao(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const nutricionistaId = req.nutricionistaId;
    const solicitacaoId = req.params.id;

    if (
      !nutricionistaId ||
      !mongoose.isValidObjectId(nutricionistaId)
    ) {
      res.status(401).json({
        mensagem: "Nutricionista não autenticado.",
      });
      return;
    }

    if (
      typeof solicitacaoId !== "string" ||
      !mongoose.isValidObjectId(solicitacaoId)
    ) {
      res.status(400).json({
        mensagem: "ID da solicitação inválido.",
      });
      return;
    }

    const solicitacao = await SolicitacaoVinculo.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(solicitacaoId),
        nutricionistaId: new mongoose.Types.ObjectId(
          nutricionistaId
        ),
        status: "PENDENTE",
      },
      {
        $set: {
          status: "RECUSADO",
        },
      },
      {
        new: true,
      }
    );

    if (!solicitacao) {
      res.status(404).json({
        mensagem: "Solicitação pendente não encontrada.",
      });
      return;
    }

    res.json({
      mensagem: "Solicitação recusada com sucesso.",
      solicitacaoId: String(solicitacao._id),
      status: solicitacao.status,
    });
  } catch (error) {
    console.error("Erro ao recusar solicitação:", error);

    res.status(500).json({
      mensagem: "Erro interno ao recusar solicitação.",
    });
  }
}


export async function aprovarSolicitacao(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const nutricionistaId = req.nutricionistaId;
  const solicitacaoId = req.params.id;

  if (!nutricionistaId || !mongoose.isValidObjectId(nutricionistaId)) {
    res.status(401).json({
      mensagem: "Nutricionista não autenticado.",
    });
    return;
  }

  if (
    typeof solicitacaoId !== "string" ||
    !mongoose.isValidObjectId(solicitacaoId)
  ) {
    res.status(400).json({
      mensagem: "ID da solicitação inválido.",
    });
    return;
  }

  const session = await mongoose.startSession();

  try {
    let resultado:
      | "APROVADO"
      | "SOLICITACAO_INDISPONIVEL"
      | "PACIENTE_INDISPONIVEL" = "SOLICITACAO_INDISPONIVEL";

    await session.withTransaction(async () => {
      const solicitacao = await SolicitacaoVinculo.findOne({
        _id: solicitacaoId,
        nutricionistaId,
        status: "PENDENTE",
      }).session(session);

      if (!solicitacao) {
        resultado = "SOLICITACAO_INDISPONIVEL";
        return;
      }

      const db = mongoose.connection.db;

      if (!db) {
        throw new Error("Banco de dados indisponível.");
      }

      const atualizacao = await db.collection("users").updateOne(
        {
          _id: solicitacao.pacienteId,
          role: "PACIENTE",
          $or: [
            { nutricionistaId: { $exists: false } },
            { nutricionistaId: null },
          ],
        },
        {
          $set: {
            nutricionistaId: new mongoose.Types.ObjectId(
              nutricionistaId
            ),
            vinculadoEm: new Date(),
          },
        },
        { session }
      );

      if (atualizacao.modifiedCount !== 1) {
        resultado = "PACIENTE_INDISPONIVEL";
        return;
      }

      solicitacao.status = "APROVADO";
      await solicitacao.save({ session });

      await SolicitacaoVinculo.updateMany(
        {
          pacienteId: solicitacao.pacienteId,
          _id: { $ne: solicitacao._id },
          status: "PENDENTE",
        },
        { $set: { status: "RECUSADO" } },
        { session }
      );

      resultado = "APROVADO";
    });

    if (resultado === "SOLICITACAO_INDISPONIVEL") {
      res.status(404).json({
        mensagem: "Solicitação pendente não encontrada.",
      });
      return;
    }

    if (resultado === "PACIENTE_INDISPONIVEL") {
      res.status(409).json({
        mensagem:
          "Paciente não encontrado ou já vinculado a um nutricionista.",
      });
      return;
    }

    res.json({
      mensagem: "Paciente vinculado com sucesso!",
      status: "APROVADO",
    });
  } catch (error) {
    console.error("Erro ao aprovar solicitação:", error);

    res.status(500).json({
      mensagem: "Erro interno ao aprovar solicitação.",
    });
  } finally {
    await session.endSession();
  }
}


export async function buscarNutricionistaPorCRN(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const crn = req.params.crn;

    if (typeof crn !== "string" || !validarCRN(crn)) {
      res.status(400).json({
        mensagem: "CRN inválido.",
      });
      return;
    }

    const crnNormalizado = normalizarCRN(crn);

    const nutricionista = await NutricionistaMongo.findOne({
      crn: crnNormalizado,
    })
      .select("_id nome crn")
      .lean();

    if (!nutricionista) {
      res.status(404).json({
        mensagem: "Nutricionista não encontrado.",
      });
      return;
    }

    res.json({
      nutricionista: {
        id: String(nutricionista._id),
        nome: nutricionista.nome,
        crn: nutricionista.crn,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar nutricionista por CRN:", error);

    res.status(500).json({
      mensagem: "Erro interno ao buscar nutricionista.",
    });
  }
}


export async function solicitarVinculo(
  req: PacienteRequest,
  res: Response
): Promise<void> {
  try {
    const pacienteId = req.pacienteId;
    const { crn } = req.body;

    if (!pacienteId) {
      res.status(401).json({
        mensagem: "Paciente não autenticado.",
      });
      return;
    }

    if (typeof crn !== "string" || !validarCRN(crn)) {
      res.status(400).json({
        mensagem: "Informe um CRN válido.",
      });
      return;
    }

    const crnNormalizado = normalizarCRN(crn);

    const nutricionista = await NutricionistaMongo.findOne({
      crn: crnNormalizado,
    }).lean();

    if (!nutricionista) {
      res.status(404).json({
        mensagem: "Nutricionista não encontrado.",
      });
      return;
    }

    const db = mongoose.connection.db;

    if (!db) {
      res.status(503).json({
        mensagem: "Banco de dados indisponível.",
      });
      return;
    }

    const pacienteObjectId = new mongoose.Types.ObjectId(pacienteId);

    const paciente = await db.collection("users").findOne({
      _id: pacienteObjectId,
      role: "PACIENTE",
    });

    if (!paciente) {
      res.status(404).json({
        mensagem: "Paciente não encontrado.",
      });
      return;
    }

    if (paciente.nutricionistaId) {
      res.status(409).json({
        mensagem: "Você já possui um nutricionista vinculado.",
      });
      return;
    }

    const solicitacaoPendente = await SolicitacaoVinculo.findOne({
      pacienteId: pacienteObjectId,
      status: "PENDENTE",
    });

    if (solicitacaoPendente) {
      res.status(409).json({
        mensagem: "Você já possui uma solicitação pendente.",
      });
      return;
    }

    const solicitacao = await SolicitacaoVinculo.create({
      pacienteId: pacienteObjectId,
      nutricionistaId: nutricionista._id,
      status: "PENDENTE",
    });

    res.status(201).json({
      sucesso: true,
      mensagem: "Solicitação enviada. Aguarde a aprovação do nutricionista.",
      solicitacao: {
        id: String(solicitacao._id),
        status: solicitacao.status,
        nutricionista: {
          id: String(nutricionista._id),
          nome: nutricionista.nome,
          crn: nutricionista.crn,
        },
      },
    });
  } catch (erro: any) {
    if (erro?.code === 11000) {
      res.status(409).json({
        mensagem: "Já existe uma solicitação pendente para este nutricionista.",
      });
      return;
    }

    console.error("Erro ao solicitar vínculo:", erro);

    res.status(500).json({
      mensagem: "Erro interno ao solicitar vínculo.",
    });
  }
}


export async function consultarStatusVinculo(
  req: PacienteRequest,
  res: Response
): Promise<void> {
  try {
    const pacienteId = req.pacienteId;

    if (!pacienteId) {
      res.status(401).json({
        mensagem: "Paciente não autenticado.",
      });
      return;
    }

    const db = mongoose.connection.db;

    if (!db) {
      res.status(503).json({
        mensagem: "Banco de dados indisponível.",
      });
      return;
    }

    const paciente = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(pacienteId),
      role: "PACIENTE",
    });

    if (!paciente) {
      res.status(404).json({
        mensagem: "Paciente não encontrado.",
      });
      return;
    }

    const solicitacao = await SolicitacaoVinculo.findOne({
      pacienteId: new mongoose.Types.ObjectId(pacienteId),
    })
      .sort({ createdAt: -1 })
      .lean();

    // Um vínculo ativo tem prioridade sobre solicitações antigas.
    if (paciente.nutricionistaId) {
      const nutricionista = await NutricionistaMongo.findById(
        paciente.nutricionistaId
      )
        .select("nome crn")
        .lean();

      res.json({
        status: "APROVADO",
        vinculado: true,
        nutricionista: nutricionista
          ? {
            id: String(nutricionista._id),
            nome: nutricionista.nome,
            crn: nutricionista.crn,
          }
          : null,
        vinculadoEm: paciente.vinculadoEm ?? null,
      });
      return;
    }

    if (!solicitacao) {
      res.json({
        status: "SEM_SOLICITACAO",
        vinculado: false,
        solicitacao: null,
      });
      return;
    }

    const nutricionista = await NutricionistaMongo.findById(
      solicitacao.nutricionistaId
    )
      .select("nome crn")
      .lean();

    res.json({
      status: solicitacao.status,
      vinculado: false,
      solicitacao: {
        id: String(solicitacao._id),
        status: solicitacao.status,
        createdAt: solicitacao.createdAt,
      },
      nutricionista: nutricionista
        ? {
          id: String(nutricionista._id),
          nome: nutricionista.nome,
          crn: nutricionista.crn,
        }
        : null,
    });
  } catch (erro) {
    console.error("Erro ao consultar status do vínculo:", erro);

    res.status(500).json({
      mensagem: "Erro interno ao consultar status do vínculo.",
    });
  }
}
