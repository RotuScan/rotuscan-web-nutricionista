
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export interface RequisicaoAutenticada extends Request {
  nutricionistaId?: string;
}

export function autenticarNutricionista(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      mensagem: "Token de autenticação não informado.",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({
      mensagem: "Token de autenticação não informado.",
    });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      mensagem: "Configuração de autenticação indisponível.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.id !== "string" ||
      payload.tipo !== "NUTRICIONISTA" ||
      !mongoose.isValidObjectId(payload.id)
    ) {
      res.status(401).json({
        mensagem: "Token inválido.",
      });
      return;
    }

    req.nutricionistaId = payload.id;
    next();
  } catch {
    res.status(401).json({
      mensagem: "Token inválido ou expirado.",
    });
  }
}
