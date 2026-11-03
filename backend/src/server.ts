
import express from "express";
import cors from "cors";
import "dotenv/config";

import { conectarMongoDB } from "./config/mongodb.js";

import authRoutes from "./routes/authRoutes.js";
import nutricionistaRoutes from "./routes/nutricionistaRoutes.js";
import pacienteRoutes from "./routes/pacienteRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const origensPermitidas = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter((origem): origem is string => Boolean(origem));

app.use(
  cors({
    origin: origensPermitidas,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/nutricionistas", nutricionistaRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "Bem-vindo à API do RotuScan!",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "API RotuScan funcionando!",
  });
});

async function iniciarServidor() {
  try {
    await conectarMongoDB();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

iniciarServidor();
