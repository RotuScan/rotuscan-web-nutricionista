export interface UsuarioLogado { id: string; nome: string; email: string; crn?: string; }
interface Sessao { token: string; nutricionista: UsuarioLogado; }
const CHAVE = "rotuscan_session";
export function salvarSessao(token: string, nutricionista: UsuarioLogado) { sessionStorage.setItem(CHAVE, JSON.stringify({ token, nutricionista })); window.dispatchEvent(new Event("rotuscan-session")); }
export function obterSessao(): Sessao | null { try { const s = JSON.parse(sessionStorage.getItem(CHAVE) || "null") as Sessao | null; return s?.token && s.nutricionista?.id ? s : null; } catch { return null; } }
export function atualizarNutricionistaSessao(nutricionista: UsuarioLogado) { const s = obterSessao(); if (s) salvarSessao(s.token, nutricionista); }
export function encerrarSessao() { sessionStorage.removeItem(CHAVE); window.dispatchEvent(new Event("rotuscan-session")); }
