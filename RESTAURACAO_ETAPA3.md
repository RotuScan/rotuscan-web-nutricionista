# RotuScan — Etapa 3
Frontend modularizado com `components/`, `pages/`, `services/` e `styles/`, sem a antiga página monolítica `Painel.tsx`.

O visual usa a folha de estilos da Etapa 2, redistribuída para `styles/painel.css`. Esta etapa restaura a **organização**, não garante fidelidade visual à versão perdida.

A rota POST `/api/auth/login` foi restaurada no backend incluído.
O backend não contém credenciais: mantenha o `.env` local que já funciona.

## Iniciar
Backend: `cd backend`, `npm.cmd install`, `npm.cmd run dev`.
Frontend (na raiz): `npm.cmd install`, `npm.cmd run dev`.

Dados de pacientes e receitas são demonstrativos. Scans reais não são expostos sem vínculo e autorização.
