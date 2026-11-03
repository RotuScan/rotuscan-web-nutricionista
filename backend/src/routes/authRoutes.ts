import { Router } from "express";
import { cadastrarNutricionista, loginNutricionista } from "../controllers/authController.js";
const router = Router();
router.post("/cadastro", cadastrarNutricionista);
router.post("/login", loginNutricionista);
export default router;
