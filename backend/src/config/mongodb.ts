import mongoose from "mongoose";

export async function conectarMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada no .env");
  await mongoose.connect(uri, { dbName: "RotuScanDB" });
  console.log("✅ MongoDB Atlas conectado ao RotuScanDB!");
}
