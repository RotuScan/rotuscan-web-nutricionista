
import { Router } from "express";

import {
  listarSolicitacoes,
  recusarSolicitacao,
  aprovarSolicitacao,
  buscarNutricionistaPorCRN,
  consultarStatusVinculo

} from "../controllers/vinculacaoController.js";

import { autenticarPaciente } from "../middlewares/autenticarPaciente.js";
import { solicitarVinculo } from "../controllers/vinculacaoController.js";

import { autenticarNutricionista } from "../middlewares/autenticarNutricionista.js";

const router = Router();

router.get(
  "/nutricionista/:crn",
  buscarNutricionistaPorCRN
);

router.use(autenticarNutricionista);

router.post(
  "/solicitar",
  autenticarPaciente,
  solicitarVinculo
);

router.get(
  "/meu-status",
  autenticarPaciente,
  consultarStatusVinculo
);

router.get("/solicitacoes", listarSolicitacoes);
router.patch("/:id/recusar", recusarSolicitacao);
router.patch("/:id/aprovar", aprovarSolicitacao);

export default router;
