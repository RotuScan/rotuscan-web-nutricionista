
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

export interface PacienteRequest extends Request {
  pacienteId?: string;
}

interface TokenPaciente extends JwtPayload {
  id: string;
  email: string;
  role: "PACIENTE";
}

export async function autenticarPaciente(
  req: PacienteRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      mensagem: "Token não fornecido.",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  const secret = process.env.MOBILE_JWT_SECRET;

  if (!secret) {
    res.status(503).json({
      mensagem: "Autenticação mobile não configurada.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as TokenPaciente;

    if (
      payload.role !== "PACIENTE" ||
      typeof payload.id !== "string" ||
      !mongoose.Types.ObjectId.isValid(payload.id)
    ) {
      res.status(403).json({
        mensagem: "Acesso permitido apenas para pacientes.",
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
      _id: new mongoose.Types.ObjectId(payload.id),
      role: "PACIENTE",
    });

    if (!paciente) {
      res.status(401).json({
        mensagem: "Paciente não encontrado.",
      });
      return;
    }

    req.pacienteId = String(paciente._id);

    next();
  } catch {
    res.status(401).json({
      mensagem: "Sessão expirada ou token inválido.",
    });
  }
}
