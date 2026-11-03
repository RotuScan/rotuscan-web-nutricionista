import { api } from "./api";
import type { UsuarioLogado } from "./sessionService";
export interface PerfilNutricionista extends UsuarioLogado { crn: string; }
export async function buscarMeuPerfil() { const r = await api<{nutricionista: PerfilNutricionista}>("/api/nutricionistas/me"); return r.nutricionista; }
export async function atualizarMeuPerfil(dados: {nome:string;email:string;crn:string}) { const r = await api<{nutricionista: PerfilNutricionista}>("/api/nutricionistas/me", {method:"PUT",body:JSON.stringify(dados)}); return r.nutricionista; }
