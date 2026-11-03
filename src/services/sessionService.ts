
export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  crn?: string;
}

interface Sessao {
  token: string;
  nutricionista: UsuarioLogado;
}

const CHAVE = "rotuscan_session";
const EVENTO_SESSAO = "rotuscan-session";

function tokenExpirado(token: string): boolean {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      return true;
    }

    const payload = partes[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const preenchimento =
      "=".repeat((4 - (payload.length % 4)) % 4);

    const dados: unknown = JSON.parse(
      atob(payload + preenchimento)
    );

    if (
      !dados ||
      typeof dados !== "object" ||
      !("exp" in dados) ||
      typeof dados.exp !== "number" ||
      !Number.isFinite(dados.exp)
    ) {
      return true;
    }

    return Date.now() >= dados.exp * 1000;
  } catch {
    return true;
  }
}

function sessaoValida(valor: unknown): valor is Sessao {
  if (!valor || typeof valor !== "object") {
    return false;
  }

  const sessao = valor as Partial<Sessao>;

  if (
    typeof sessao.token !== "string" ||
    !sessao.token.trim()
  ) {
    return false;
  }

  const nutricionista = sessao.nutricionista;

  if (
    !nutricionista ||
    typeof nutricionista !== "object" ||
    typeof nutricionista.id !== "string" ||
    !nutricionista.id.trim() ||
    typeof nutricionista.nome !== "string" ||
    typeof nutricionista.email !== "string"
  ) {
    return false;
  }

  return true;
}

export function salvarSessao(
  token: string,
  nutricionista: UsuarioLogado
): void {
  const sessao: Sessao = {
    token,
    nutricionista,
  };

  sessionStorage.setItem(
    CHAVE,
    JSON.stringify(sessao)
  );

  window.dispatchEvent(
    new Event(EVENTO_SESSAO)
  );
}

export function obterSessao(): Sessao | null {
  try {
    const armazenada = sessionStorage.getItem(CHAVE);

    if (!armazenada) {
      return null;
    }

    const sessao: unknown = JSON.parse(armazenada);

    if (!sessaoValida(sessao)) {
      encerrarSessao();
      return null;
    }

    if (tokenExpirado(sessao.token)) {
      encerrarSessao();
      return null;
    }

    return sessao;
  } catch {
    encerrarSessao();
    return null;
  }
}

export function atualizarNutricionistaSessao(
  nutricionista: UsuarioLogado
): void {
  const sessao = obterSessao();

  if (!sessao) {
    return;
  }

  salvarSessao(
    sessao.token,
    nutricionista
  );
}

export function encerrarSessao(): void {
  const existiaSessao =
    sessionStorage.getItem(CHAVE) !== null;

  sessionStorage.removeItem(CHAVE);

  if (existiaSessao) {
    window.dispatchEvent(
      new Event(EVENTO_SESSAO)
    );
  }
}
