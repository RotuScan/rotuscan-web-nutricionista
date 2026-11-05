import mongoose from "mongoose";
import dns from "node:dns";

if (process.env.DNS_SERVERS) {
  dns.setServers(
    process.env.DNS_SERVERS.split(",").map((server) => server.trim())
  );
};

export async function conectarMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada no .env");
  await mongoose.connect(uri, { dbName: "RotuScanDB" });
  console.log("✅ MongoDB Atlas conectado ao RotuScanDB!");
}
