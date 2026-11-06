
import { Response } from "express";
import mongoose from "mongoose";
import { RequisicaoAutenticada } from "../middlewares/autenticarNutricionista.js";

export async function listarPacientes(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const nutricionistaId = req.nutricionistaId;

    if (!nutricionistaId || !mongoose.isValidObjectId(nutricionistaId)) {
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

    const pacientes = await db
      .collection("users")
      .find({
        nutricionistaId: new mongoose.Types.ObjectId(nutricionistaId),
        role: "PACIENTE",
        vinculadoEm: { $type: "date" },
      })
      .project({
        nome: 1,
        restricoes: 1,
        niveisSensibilidade: 1,
      })
      .sort({ nome: 1 })
      .toArray();

    res.json({
      pacientes: pacientes.map((paciente) => ({
        id: paciente._id.toString(),
        nome: paciente.nome ?? "Paciente sem nome",
        restricoes: paciente.restricoes ?? [],
        niveisSensibilidade: paciente.niveisSensibilidade ?? {},
      })),
    });
  } catch (error) {
    console.error("Erro ao listar pacientes:", error);

    res.status(500).json({
      mensagem: "Erro interno ao listar pacientes.",
    });
  }
}


export async function obterPacientePorId(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const nutricionistaId = req.nutricionistaId;
    const pacienteId = req.params.id;

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
      typeof pacienteId !== "string" ||
      !mongoose.isValidObjectId(pacienteId)
    ) {
      res.status(400).json({
        mensagem: "ID do paciente inválido.",
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

    const paciente = await db.collection("users").findOne(
      {
        _id: new mongoose.Types.ObjectId(pacienteId),
        nutricionistaId: new mongoose.Types.ObjectId(
          nutricionistaId
        ),
        role: "PACIENTE",
      },
      {
        projection: {
          nome: 1,
          email: 1,
          restricoes: 1,
          niveisSensibilidade: 1,
          vinculadoEm: 1,
        },
      }
    );

    if (!paciente) {
      res.status(404).json({
        mensagem: "Paciente não encontrado ou não vinculado.",
      });
      return;
    }

    const vinculadoEm = paciente.vinculadoEm;

    if (
      !(vinculadoEm instanceof Date) ||
      Number.isNaN(vinculadoEm.getTime())
    ) {
      res.status(403).json({
        mensagem: "Data de autorização do vínculo não encontrada.",
      });
      return;
    }

    const scans = await db
      .collection("scanlogs")
      .find({
        userId: {
          $in: [
            paciente._id,
            paciente._id.toString(),
          ],
        },
        createdAt: {
          $gte: vinculadoEm,
        },
      })
      .project({
        nomeProduto: 1,
        veredito: 1,
        createdAt: 1,
        intoleranciaDetectada: 1,
        alergicosDetectados: 1,
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({
      paciente: {
        id: paciente._id.toString(),
        nome: paciente.nome ?? "Paciente sem nome",
        email: paciente.email ?? "",
        restricoes: paciente.restricoes ?? [],
        niveisSensibilidade:
          paciente.niveisSensibilidade ?? {},
      },
      scans: scans.map((scan) => ({
        id: scan._id.toString(),
        nomeProduto:
          scan.nomeProduto ?? "Produto não informado",
        veredito: scan.veredito ?? "INDEFINIDO",
        createdAt: scan.createdAt,
        intoleranciaDetectada:
          scan.intoleranciaDetectada ?? [],
        alergicosDetectados:
          scan.alergicosDetectados ?? [],
      })),
    });
  } catch (error) {
    console.error("Erro ao consultar paciente:", error);

    res.status(500).json({
      mensagem: "Erro interno ao consultar paciente.",
    });
  }
}

