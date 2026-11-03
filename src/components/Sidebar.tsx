import { NavLink } from "react-router-dom";
import { LayoutDashboard, UsersRound, ClipboardList, Settings, LogOut } from "lucide-react";
export default function Sidebar({onSair}:{onSair:()=>void}) {
 return <aside className="sidebar"><div className="side-logo">ROTUSCAN</div><nav>
 <NavLink to="/pacientes"><UsersRound size={18}/>Paciente</NavLink>
 <NavLink to="/dashboard"><LayoutDashboard size={18}/>Dashboard</NavLink>
 <NavLink to="/receitas"><ClipboardList size={18}/>Receitas</NavLink>
 <NavLink to="/configuracoes"><Settings size={18}/>Configuração</NavLink>
 </nav><div className="side-bottom"><button onClick={onSair}><LogOut size={17}/> SAIR</button></div></aside>;
}
