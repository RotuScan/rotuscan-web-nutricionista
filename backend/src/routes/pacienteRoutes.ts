
import { Router } from "express";

import {
  listarPacientes,
  obterPacientePorId,
} from "../controllers/pacienteController.js";

import { autenticarNutricionista } from "../middlewares/autenticarNutricionista.js";

const router = Router();

router.use(autenticarNutricionista);

router.get("/", listarPacientes);
router.get("/:id", obterPacientePorId);

export default router;
