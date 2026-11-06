
import { Router } from "express";
import { autenticarNutricionista } from "../middlewares/autenticarNutricionista.js";
import {
    obterMeuPerfil,
    atualizarMeuPerfil,
} from "../controllers/nutricionistaController.js";

const router = Router();

router.use(autenticarNutricionista);

router.get("/me", obterMeuPerfil);
router.put("/me", atualizarMeuPerfil);

export default router;
