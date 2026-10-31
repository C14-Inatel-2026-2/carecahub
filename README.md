# CarecaHub

## Descrição

O CarecaHub é uma plataforma para apoiar turmas na organização de projetos
acadêmicos. Ela reúne estudantes, monitores, professores e administradores em
um único ambiente para formar grupos, cadastrar projetos e repositórios,
publicar atividades, acompanhar entregas e centralizar notificações.

## Requisitos funcionais

- Autenticar usuários e permitir a alteração de senha.
- Gerenciar usuários com os papéis de administrador, professor, monitor e
  aluno.
- Permitir a criação e administração de grupos de projeto.
- Permitir o cadastro, a consulta e a personalização de projetos e seus
  repositórios.
- Permitir que professores publiquem atividades, acompanhem entregas e
  avaliem submissões de grupos.
- Permitir que alunos visualizem atividades e enviem suas entregas.
- Exibir notificações de convites para grupos e atualizações de atividades.
- Exibir perfis de usuários com informações acadêmicas e dados públicos do
  GitHub quando disponíveis.

## Requisitos não funcionais

- A aplicação deve aplicar autorização por papel (role) em todas as operações da API.
- Senhas e credenciais não devem ser expostas em código, logs ou repositório;
  a configuração deve ser feita por variáveis de ambiente.
- A interface deve ser responsiva e utilizável em telas de diferentes tamanhos.
- Registros removidos devem ser preservados por exclusão lógica quando
  aplicável.
- A API e a interface web devem permanecer separadas, com contratos de dados
  tipados e validação de entradas.
- Funcionalidades críticas devem possuir testes automatizados de comportamento
  e autorização.

## Método ágil e histórias de usuário

Para gerenciar as fixtures a serem feitas no projeto, um board de cards chamado "CarecaHub - Tickets" foi criado no Trello e separado em 7 colunas.

BACKLOG --> TO DO --> STAND_BY --> WORKING --> PULL_REQUEST --> MERGED --> DONE

Cada card gerado descreve o escopo de atuação, como [ WEB ], [ API ] ou [ INTEGRAÇÃO ], um título descreve a implementação/ajuste, uma descrição detalhada do que precisa ser feito com seus critérios de aceite e tags aplicadas que definem se é ajuste ou implementação. Os cards são distribuídos entre os integrantes com atribuição exibida no Trello.

Algumas histórias de usuário estão em [docs/stories](docs/stories).

## Run locally

```bash
cp .env.jenkins.example .env.jenkins
# Edite .env.jenkins com o administrador e o token do GitHub antes de subir o Jenkins.
docker compose up -d --build

cp api/.env.example api/.env
cp web/.env.example web/.env

cd api
pnpm install
pnpm db:g
pnpm db:m
pnpm db:seed
pnpm dev
```

In another terminal:

```bash
cd web
pnpm install
pnpm dev
```

API: `http://localhost:3030`
Web: `http://localhost:5173`
Jenkins: `http://localhost:8080`

## New feature checklist

1. Add or update the model in `api/drizzle`.
2. Create and apply a Drizzle migration.
3. Add the Nest resource: module, controller, service, interface, and DTOs.
4. Register the resource module in `api/src/app.module.ts`.
5. Add frontend Zod schemas, inferred request and response types in `web/src/types/<domain>.ts`.
6. Add the endpoint and response type to `web/src/api/use-list.tsx` when it is a list.
7. Add mutation endpoints to `web/src/api/writer.types.ts`.
8. Add feature pages and dialogs under `web/src/modules/<domain>/`.
9. Add the route and, when needed, the sidebar entry in the web app.

---

Keep it simple.
