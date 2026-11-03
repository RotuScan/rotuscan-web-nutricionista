# RotuScan — recuperação (etapa 1)

Esta cópia foi criada a partir do ZIP antigo, **sem incluir o `.env` original nem `node_modules`**.

## Backend restaurado
- Conexão MongoDB Atlas, banco `RotuScanDB`
- `POST /api/auth/cadastro` e `POST /api/auth/login`
- JWT com duração de 8 horas
- `GET /api/nutricionistas/me` e `PUT /api/nutricionistas/me`, protegidos por JWT
- Respostas compatíveis com o frontend desenvolvido anteriormente

## Como executar
1. Abra o terminal na pasta `backend` e execute `npm install`.
2. Copie `.env.example` para `.env` e preencha **localmente** `MONGODB_URI` e `JWT_SECRET`. Não compartilhe o arquivo `.env`.
3. Execute `npm run dev`.
4. Verifique `http://localhost:3000/api/health`.
5. Teste login usando uma conta já existente no MongoDB Atlas.

## Atenção
- O frontend incluído é o **backup antigo**. Ainda não possui as telas recentes de Dashboard, Pacientes, Receitas e Configurações, nem autenticação conectada à API.
- O banco de dados não foi alterado. **Não execute novamente a migração PostgreSQL → MongoDB**.
- Os dois arquivos `.legado.txt` são cópias de referência da versão PostgreSQL e não participam da execução.
- O `package-lock.json` do backend foi removido porque as dependências mudaram; `npm install` o recriará.
- Esta etapa foi preparada a partir do código disponível; a conexão real com o Atlas exige suas credenciais locais.


## Etapa 2 — Frontend reconstruído

Com o backend rodando na porta 3000, abra OUTRO terminal na pasta raiz `rotuscan-restaurado` (não na pasta backend):

```powershell
npm.cmd install
npm.cmd run dev
```

Abra http://localhost:5173/login. Entre com uma conta existente do MongoDB Atlas. O cadastro também funciona.

As telas Dashboard, Pacientes e Receitas foram reconstruídas com dados de demonstração claramente identificados; NÃO exibem registros reais de pacientes nem scans sem vinculação/autorização. Configurações carrega e salva nome, email e CRN no MongoDB.

Aparência: reconstrução aproximada baseada no backup e no histórico da conversa; não é cópia pixel-perfect das telas perdidas.
