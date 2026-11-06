
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  normalizarCRN,
  validarEmail,
  validarSenha,
  validarCRN,
  validarNome,
} from "../utils/validacaoAuth.js";

import { NutricionistaMongo } from "../models/NutricionistaMongo.js";


export async function cadastrarNutricionista(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { nome, email, senha, crn } = req.body ?? {};

    if (
      typeof nome !== "string" ||
      typeof email !== "string" ||
      typeof senha !== "string" ||
      typeof crn !== "string" ||
      !nome.trim() ||
      !email.trim() ||
      !senha ||
      !crn.trim()
    ) {
      res.status(400).json({
        mensagem: "Nome, e-mail, senha e CRN são obrigatórios.",
      });
      return;
    }

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const crnLimpo = normalizarCRN(crn);

    if (!validarNome(nome) || !validarEmail(email)) {
      res.status(400).json({
        mensagem: "Nome ou e-mail inválido.",
      });
      return;
    }

    if (!validarSenha(senha)) {
      res.status(400).json({
        mensagem: "A senha deve ter entre 8 e 72 caracteres.",
      });
      return;
    }

    if (!validarCRN(crn)) {
      res.status(400).json({
        mensagem: "CRN inválido. Exemplo: CRN-3 12345.",
      });
      return;
    }

    const emailExistente = await NutricionistaMongo.findOne({
      email: emailLimpo,
    });

    if (emailExistente) {
      res.status(409).json({
        mensagem: "Este e-mail já está cadastrado.",
      });
      return;
    }

    const crnExistente = await NutricionistaMongo.findOne({
      crn: crnLimpo,
    });

    if (crnExistente) {
      res.status(409).json({
        mensagem: "Este CRN já está cadastrado.",
      });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const nutricionista = await NutricionistaMongo.create({
      nome: nomeLimpo,
      email: emailLimpo,
      senha: senhaHash,
      crn: crnLimpo,
    });

    res.status(201).json({
      mensagem: "Nutricionista cadastrado com sucesso!",
      nutricionista: {
        id: nutricionista._id.toString(),
        nome: nutricionista.nome,
        email: nutricionista.email,
        crn: nutricionista.crn,
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

    console.error("Erro ao cadastrar nutricionista:", error);

    res.status(500).json({
      mensagem: "Erro interno ao realizar cadastro.",
    });
  }
}

export async function loginNutricionista(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, senha } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha
    ) {
      res.status(400).json({
        mensagem: "E-mail e senha são obrigatórios.",
      });
      return;
    }

    const nutricionista = await NutricionistaMongo.findOne({
      email: email.trim().toLowerCase(),
    });

    if (
      !nutricionista ||
      !(await bcrypt.compare(senha, nutricionista.senha))
    ) {
      res.status(401).json({
        mensagem: "E-mail ou senha incorretos.",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET não configurado.");
    }

    const id = nutricionista._id.toString();


    const token = jwt.sign(
      {
        id,
        tipo: "NUTRICIONISTA",
      },
      secret,
      {
        algorithm: "HS256",
        expiresIn: "8h",
      }
    );


    res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      token,
      nutricionista: {
        id,
        nome: nutricionista.nome,
        email: nutricionista.email,
        crn: nutricionista.crn ?? "",
      },
    });
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    res.status(500).json({
      mensagem: "Erro interno ao realizar login.",
    });
  }
}
