
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";

import logoCompleta from "../assets/rotuscan-logo.png";
import logoSimbolo from "../assets/rotuscan-simbolo.png";

interface SidebarProps {
  onSair: () => void;
}

export default function Sidebar({ onSair }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="side-logo">
        <picture>
          <source
            media="(max-width: 700px)"
            srcSet={logoSimbolo}
          />
          <img
            src={logoCompleta}
            alt="RotuScan"
            className="sidebar-logo-img"
          />
        </picture>
      </div>

      <nav aria-label="Menu principal">
        <NavLink to="/dashboard">
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/pacientes">
          <UsersRound size={18} />
          Pacientes
        </NavLink>

        <NavLink to="/receitas">
          <ClipboardList size={18} />
          Receitas
        </NavLink>

        <NavLink to="/configuracoes">
          <Settings size={18} />
          Configurações
        </NavLink>
      </nav>

      <div className="side-bottom">
        <button type="button" onClick={onSair}>
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
