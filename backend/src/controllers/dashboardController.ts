
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

    // Apenas pacientes com vínculo ativo e data válida.
    const pacientesEncontrados = await db
      .collection("users")
      .find({
        nutricionistaId: new mongoose.Types.ObjectId(
          nutricionistaId
        ),
        role: "PACIENTE",
        vinculadoEm: { $type: "date" },
      })
      .project({
        nome: 1,
        vinculadoEm: 1,
      })
      .toArray();

    const pacientes = pacientesEncontrados.filter(
      (paciente) =>
        paciente.vinculadoEm instanceof Date &&
        !Number.isNaN(paciente.vinculadoEm.getTime())
    );

    const totalPacientes = pacientes.length;

    if (totalPacientes === 0) {
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

    // Cada paciente só pode ter scans consultados
    // a partir da sua própria data de aprovação.
    const filtro = {
      $or: pacientes.map((paciente) => ({
        userId: {
          $in: [
            paciente._id,
            paciente._id.toString(),
          ],
        },
        createdAt: {
          $gte: paciente.vinculadoEm as Date,
        },
      })),
    };

    const totalScans =
      await scansCollection.countDocuments(filtro);

    const seteDiasAtras = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const alertasRecentes =
      await scansCollection.countDocuments({
        $and: [
          filtro,
          {
            veredito: "PERIGOSO",
            createdAt: { $gte: seteDiasAtras },
          },
        ],
      });

    const dataInicial = new Date();
    dataInicial.setUTCHours(0, 0, 0, 0);
    dataInicial.setUTCDate(
      dataInicial.getUTCDate() - 29
    );

    const scansPorDia = await scansCollection
      .aggregate([
        {
          $match: {
            $and: [
              filtro,
              {
                createdAt: { $gte: dataInicial },
              },
            ],
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
        nomeProduto:
          scan.nomeProduto ?? "Produto não informado",
        paciente:
          nomesPacientes.get(
            scan.userId?.toString()
          ) ?? "Paciente",
        data: scan.createdAt,
        veredito:
          scan.veredito ?? "INDEFINIDO",
      })),
    });
  } catch (error) {
    console.error(
      "Erro ao consultar dashboard:",
      error
    );

    res.status(500).json({
      mensagem: "Erro interno ao consultar dashboard.",
    });
  }
}
