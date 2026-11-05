
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

// Consulta por CRN
router.get(
  "/nutricionista/:crn",
  buscarNutricionistaPorCRN
);

// Todas as rotas deste arquivo exigem
// autenticação do nutricionista.
router.use(autenticarNutricionista);

// Lista solicitações pendentes do nutricionista.
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
