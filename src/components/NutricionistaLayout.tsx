
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { encerrarSessao, obterSessao } from "../services/sessionService";

import Sidebar from "./Sidebar";
import Header from "./Header";

import "../styles/painel.css";

export default function NutricionistaLayout() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(
    obterSessao()?.nutricionista
  );

  useEffect(() => {
    const atualizar = () => {
      setUsuario(obterSessao()?.nutricionista);
    };

    window.addEventListener("rotuscan-session", atualizar);

    return () => {
      window.removeEventListener("rotuscan-session", atualizar);
    };
  }, []);

  function sair() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-layout">
      <Sidebar onSair={sair} />

      <div className="main-column">
        <Header nome={usuario?.nome} />

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
