
import { CircleUserRound } from "lucide-react";
import { useLocation } from "react-router-dom";

interface HeaderProps {
  nome?: string;
}

export default function Header({ nome }: HeaderProps) {
  const { pathname } = useLocation();

  function obterTitulo() {
    if (pathname === "/pacientes") {
      return (
        <>
          Bem-vindo,{" "}
          <span className="greeting-name">
            {nome || "Nutricionista"}!
          </span>
        </>
      );
    }

    if (pathname.startsWith("/pacientes/")) {
      return "Perfil do paciente";
    }

    if (pathname.startsWith("/dashboard")) {
      return "Dashboard";
    }

    if (pathname.startsWith("/receitas")) {
      return "Receitas";
    }

    if (pathname.startsWith("/configuracoes")) {
      return "Configurações";
    }

    return "RotuScan";
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        {obterTitulo()}
      </div>

      <div
        className="topbar-account"
        title={nome || "Nutricionista"}
      >
        <span className="topbar-account-avatar">
          <CircleUserRound size={23} />
        </span>

        <div className="topbar-account-info">
          <strong>{nome || "Nutricionista"}</strong>
          <small>Nutricionista</small>
        </div>
      </div>
    </header>
  );
}
