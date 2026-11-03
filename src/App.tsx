
import { Navigate, Route, Routes } from "react-router-dom";

import { obterSessao } from "./services/sessionService";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import PerfilPaciente from "./pages/PerfilPaciente";
import Receitas from "./pages/Receitas";
import Configuracoes from "./pages/Configuracoes";

import ProtectedRoute from "./components/ProtectedRoute";
import NutricionistaLayout from "./components/NutricionistaLayout";

function RotaPublica() {
  const sessao = obterSessao();

  if (sessao) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
}

function RotaInicial() {
  const sessao = obterSessao();

  return (
    <Navigate
      to={sessao ? "/dashboard" : "/login"}
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* ROTAS PÚBLICAS */}
      <Route path="/login" element={<RotaPublica />} />
      <Route path="/cadastro" element={<RotaPublica />} />

      {/* ROTAS PROTEGIDAS */}
      <Route
        element={
          <ProtectedRoute>
            <NutricionistaLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/pacientes" element={<Pacientes />} />

        <Route
          path="/pacientes/:id"
          element={<PerfilPaciente />}
        />

        <Route path="/receitas" element={<Receitas />} />

        <Route
          path="/configuracoes"
          element={<Configuracoes />}
        />
      </Route>

      {/* ROTAS NÃO ENCONTRADAS */}
      <Route path="*" element={<RotaInicial />} />
    </Routes>
  );
}
