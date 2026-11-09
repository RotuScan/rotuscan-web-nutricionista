
import { Router } from "express";

import { autenticarNutricionista } from "../middlewares/autenticarNutricionista.js";

import {
  listarMensagens,
  enviarMensagem,
  marcarMensagensLidas,
} from "../controllers/chatController.js";

const router = Router();

router.use(autenticarNutricionista);

router.get("/pacientes/:pacienteId/mensagens", listarMensagens);

router.post("/pacientes/:pacienteId/mensagens", enviarMensagem);

router.patch(
  "/pacientes/:pacienteId/mensagens/lidas",
  marcarMensagensLidas
);

export default router;
