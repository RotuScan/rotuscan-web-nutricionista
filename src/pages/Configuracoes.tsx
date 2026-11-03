
import "../styles/configuracoes.css";

import { useEffect, useState, type FormEvent } from "react";
import {
  UserRound,
  Link2,
  ShieldCheck,
  Camera,
  LockKeyhole,
  LogOut,
  Save,
  Copy,
  Check,
} from "lucide-react";

import {
  obterSessao,
  atualizarNutricionistaSessao,
} from "../services/sessionService";

import {
  buscarMeuPerfil,
  atualizarMeuPerfil,
} from "../services/nutricionistaService";

export default function Configuracoes() {
  const [sessao] = useState(() => obterSessao());

  const [nome, setNome] = useState(
    sessao?.nutricionista.nome ?? ""
  );
  const [email, setEmail] = useState(
    sessao?.nutricionista.email ?? ""
  );
  const [crn, setCrn] = useState(
    sessao?.nutricionista.crn ?? ""
  );
  const [crnSalvo, setCrnSalvo] = useState(
  sessao?.nutricionista.crn ?? ""
);

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let ativo = true;

    buscarMeuPerfil()
      .then((perfil) => {
        if (!ativo) return;

        setNome(perfil.nome);
        setEmail(perfil.email);
        setCrn(perfil.crn ?? "");
        setCrnSalvo(perfil.crn ?? "");

        atualizarNutricionistaSessao(perfil);
      })
      .catch((erro) => {
        if (ativo) {
          setMensagem(
            erro instanceof Error
              ? erro.message
              : "Erro ao carregar perfil."
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSalvando(true);
    setMensagem("");

    try {
      const perfil = await atualizarMeuPerfil({
        nome: nome.trim(),
        email: email.trim(),
        crn: crn.trim(),
      });

      setNome(perfil.nome);
      setEmail(perfil.email);
      setCrn(perfil.crn ?? "");
      setCrnSalvo(perfil.crn ?? "");
setCopiado(false);

      atualizarNutricionistaSessao(perfil);

      setMensagem("Perfil atualizado com sucesso!");
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  
async function copiarCRN() {
  if (!crnSalvo.trim() || carregando || salvando) return;

  try {
    await navigator.clipboard.writeText(crnSalvo.trim());
    setCopiado(true);
  } catch {
    setMensagem("Não foi possível copiar o CRN.");
  }
}


  return (
    <div className="settings-page">
      <div className="settings-heading">
      
        <p>
          Gerencie sua conta e suas preferências profissionais.
        </p>
      </div>

      <form className="settings-card" onSubmit={salvar}>
        <h2>
          <UserRound size={20} />
          Perfil profissional
        </h2>

        <div className="settings-profile">
          <span className="settings-avatar">
            <UserRound size={34} />
          </span>

          <div>
            <strong>Foto de perfil</strong>
            <p>Personalize sua identificação profissional.</p>
            <small>
              <Camera size={13} />
              Alteração de foto em breve
            </small>
          </div>
        </div>

        <div className="settings-fields">
          <label>
            Nome completo
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={150}
              required
              disabled={carregando || salvando}
            />
          </label>

          <label>
            Registro profissional (CRN)
            <input
              value={crn}
              onChange={(e) => {
                setCrn(e.target.value);
                setCopiado(false);
              }}
              maxLength={40}
              placeholder="Ex.: CRN-3 12345"
              disabled={carregando || salvando}
            />
          </label>

          <label className="full">
            E-mail profissional
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={carregando || salvando}
            />
          </label>
        </div>

        {mensagem && (
          <p className="settings-message" role="status">
            {mensagem}
          </p>
        )}

        <div className="settings-actions">
          <button disabled={carregando || salvando}>
            <Save size={16} />
            {salvando
              ? "Salvando..."
              : carregando
                ? "Carregando..."
                : "Salvar alterações"}
          </button>
        </div>
      </form>

      <section className="settings-card">
        <h2>
          <Link2 size={20} />
          Vinculação de pacientes
        </h2>

        <p>
          Seus pacientes poderão informar seu CRN no aplicativo
          RotuScan para solicitar a vinculação ao seu perfil
          profissional.
        </p>

        <div className="settings-code">
          <span>Seu registro profissional (CRN)</span>

          <strong>
  {carregando
    ? "Carregando..."
    : crnSalvo.trim() || "Não cadastrado"}
</strong>

          <button
            type="button"
            onClick={copiarCRN}
            disabled={!crnSalvo.trim() || carregando || salvando}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            {copiado ? (
              <Check size={16} />
            ) : (
              <Copy size={16} />
            )}

            {copiado ? "Copiado!" : "Copiar CRN"}
          </button>

          <small>
            A vinculação estará disponível após a integração
            com o aplicativo mobile.
          </small>
        </div>
      </section>

      <section className="settings-card">
        <h2>
          <ShieldCheck size={20} />
          Segurança da conta
        </h2>

        <div className="settings-security">
          <LockKeyhole size={19} />

          <div>
            <strong>Alterar senha</strong>
            <p>Atualize sua senha de acesso.</p>
          </div>

          <small>Em breve</small>
        </div>

        <div className="settings-security">
          <LogOut size={19} />

          <div>
            <strong>Encerrar sessão</strong>
            <p>Utilize a opção SAIR no menu lateral.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
