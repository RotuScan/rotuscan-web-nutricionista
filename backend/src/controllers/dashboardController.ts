
import { Response } from "express";
import mongoose from "mongoose";
import { RequisicaoAutenticada } from "../middlewares/autenticarNutricionista.js";

export async function obterDashboard(
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

    const pacientes = await db
      .collection("users")
      .find({
        nutricionistaId: new mongoose.Types.ObjectId(
          nutricionistaId
        ),
        role: "PACIENTE",
      })
      .project({ nome: 1 })
      .toArray();

    const idsPacientes = pacientes.map(
      (paciente) => paciente._id
    );

    const totalPacientes = pacientes.length;

    if (idsPacientes.length === 0) {
      res.json({
        totalPacientes: 0,
        totalScans: 0,
        alertasRecentes: 0,
        scansPorDia: [],
        ultimosScans: [],
      });
      return;
    }

    const scansCollection = db.collection("scanlogs");

    const filtro = {
      userId: { $in: idsPacientes },
    };

    const totalScans = await scansCollection.countDocuments(
      filtro
    );

    const alertasRecentes =
      await scansCollection.countDocuments({
        ...filtro,
        veredito: "PERIGOSO",
        createdAt: {
          $gte: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ),
        },
      });

    const dataInicial = new Date();
    dataInicial.setUTCHours(0, 0, 0, 0);
    dataInicial.setUTCDate(dataInicial.getUTCDate() - 29);

    const scansPorDia = await scansCollection
      .aggregate([
        {
          $match: {
            ...filtro,
            createdAt: { $gte: dataInicial },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "America/Sao_Paulo",
              },
            },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            data: "$_id",
            total: 1,
          },
        },
      ])
      .toArray();

    const ultimosScans = await scansCollection
      .find(filtro)
      .project({
        nomeProduto: 1,
        userId: 1,
        veredito: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const nomesPacientes = new Map(
      pacientes.map((paciente) => [
        paciente._id.toString(),
        paciente.nome ?? "Paciente",
      ])
    );

    res.json({
      totalPacientes,
      totalScans,
      alertasRecentes,
      scansPorDia,
      ultimosScans: ultimosScans.map((scan) => ({
        id: scan._id.toString(),
        nomeProduto: scan.nomeProduto ?? "Produto não informado",
        paciente:
          nomesPacientes.get(scan.userId?.toString()) ??
          "Paciente",
        data: scan.createdAt,
        veredito: scan.veredito ?? "INDEFINIDO",
      })),
    });
  } catch (error) {
    console.error("Erro ao consultar dashboard:", error);

    res.status(500).json({
      mensagem: "Erro interno ao consultar dashboard.",
    });
  }
}
