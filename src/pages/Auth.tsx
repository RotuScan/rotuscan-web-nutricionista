
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  LockKeyhole,
  BadgeCheck,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  loginNutricionista,
  cadastrarNutricionista,
} from "../services/authService";

import { salvarSessao } from "../services/sessionService";
import logoSimbolo from "../assets/rotuscan-simbolo.png";
import "../styles/auth.css";

type AuthMode = "login" | "cadastro";

function validarCRN(crn: string): boolean {
  return /^CRN[-\s]?\d{1,2}\s+\d{3,10}$/i.test(crn.trim());
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const mode: AuthMode =
    location.pathname === "/cadastro" ? "cadastro" : "login";

  const [nome, setNome] = useState("");
  const [crn, setCrn] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const isCadastro = mode === "cadastro";

  function trocarModo() {
    setErro("");
    setSenha("");
    setConfirmarSenha("");
    setMostrarSenha(false);

    navigate(isCadastro ? "/login" : "/cadastro");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) return;

    if (isCadastro) {
      if (senha.length < 8 || senha.length > 72) {
        setErro("A senha deve ter entre 8 e 72 caracteres.");
        return;
      }

      if (!validarCRN(crn)) {
        setErro("CRN inválido. Use o formato CRN-3 12345.");
        return;
      }

      if (senha !== confirmarSenha) {
        setErro("As senhas não coincidem.");
        return;
      }
    }


    setErro("");
    setCarregando(true);

    try {
      if (isCadastro) {
        await cadastrarNutricionista(
          nome.trim(),
          email.trim(),
          senha,
          crn.trim()
        );
      }

      const resposta = await loginNutricionista(
        email.trim(),
        senha
      );

      salvarSessao(
        resposta.token,
        resposta.nutricionista
      );

      navigate("/pacientes", { replace: true });
    } catch (e) {
      const mensagem =
        e instanceof Error
          ? e.message
          : "Ocorreu um erro inesperado. Tente novamente.";

      setErro(
        mensagem === "Failed to fetch"
          ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
          : mensagem
      );
    }
  }
  return (
    <main className="auth-page">
      <div className="shape shape-red" aria-hidden="true" />
      <div className="shape shape-yellow" aria-hidden="true" />

      <section className="auth-card">
        <aside className="auth-sidebar">
          <div className="brand">
            <img
              src={logoSimbolo}
              alt="RotuScan"
              className="auth-logo"
            />
          </div>

          <div className="sidebar-content">
            <h2>
              {isCadastro ? (
                <>
                  Já possui
                  <br />
                  uma conta?
                </>
              ) : (
                <>
                  Ainda não possui
                  <br />
                  uma conta?
                </>
              )}
            </h2>

            <button
              type="button"
              className="switch-button"
              onClick={trocarModo}
              disabled={carregando}
            >
              {isCadastro ? "Fazer login" : "Criar conta"}
            </button>
          </div>
        </aside>

        <div className="auth-form-panel">
          <div className="form-content">
            <h1>
              {isCadastro ? "Criar conta" : "Bem-vindo de volta!"}
            </h1>

            <p className="auth-description">
              {isCadastro
                ? "Cadastre-se para acompanhar seus pacientes."
                : "Acesse sua conta profissional RotuScan."}
            </p>

            <form onSubmit={handleSubmit}>
              {isCadastro && (
                <>
                  <label className="input-group">
                    <span className="input-icon">
                      <UserRound size={18} />
                    </span>

                    <input
                      type="text"
                      placeholder="Nome completo"
                      aria-label="Nome completo"
                      autoComplete="name"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </label>

                  <label className="input-group">
                    <span className="input-icon">
                      <BadgeCheck size={18} />
                    </span>

                    <input
                      type="text"
                      placeholder="CRN (Ex.: CRN-3 12345)"
                      aria-label="Registro profissional CRN"
                      autoComplete="off"
                      value={crn}
                      onChange={(e) => setCrn(e.target.value)}
                      maxLength={40}
                      required
                    />
                  </label>

                  <p className="auth-field-hint">
                    Informe seu registro profissional no formato
                    CRN-3 12345.
                  </p>
                </>
              )}

              <label className="input-group">
                <span className="input-icon">
                  <Mail size={18} />
                </span>

                <input
                  type="email"
                  placeholder="E-mail"
                  aria-label="E-mail"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="input-group">
                <span className="input-icon">
                  <LockKeyhole size={18} />
                </span>

                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Senha"
                  aria-label="Senha"
                  autoComplete={
                    isCadastro
                      ? "new-password"
                      : "current-password"
                  }
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  minLength={isCadastro ? 8 : undefined}
                  required
                />



                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                  aria-pressed={mostrarSenha}
                >
                  {mostrarSenha ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </label>

              {isCadastro && (
                <label className="input-group">
                  <span className="input-icon">
                    <LockKeyhole size={18} />
                  </span>

                  <input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Confirmar senha"
                    aria-label="Confirmar senha"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>
              )}

              {isCadastro && (
                <p className="auth-field-hint">
                  A senha deve conter pelo menos 8 caracteres.
                </p>
              )}

              {erro && (
                <p className="auth-error" role="alert">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={carregando}
              >
                {carregando
                  ? "Aguarde..."
                  : isCadastro
                    ? "Criar conta"
                    : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
