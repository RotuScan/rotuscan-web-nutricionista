
import { Router } from "express";
import { autenticarNutricionista } from "../middlewares/autenticarNutricionista.js";
import { obterDashboard } from "../controllers/dashboardController.js";

const router = Router();

router.get("/", autenticarNutricionista, obterDashboard);

export default router;
