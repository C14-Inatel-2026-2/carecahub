# Detalhes do GitHub nos usuários

## Objetivo

Enriquecer os retornos de busca de usuários com informações públicas do perfil associado no GitHub. `GET /users` e `GET /users/:id` passarão a incluir `gitHubDetails`, sem modificar os contratos das operações de criação e atualização.

## Contrato de resposta

Cada usuário retornado pelas buscas terá a propriedade:

```ts
type GitHubUserDetails = {
  login: string
  avatarUrl: string
  profileUrl: string
  bio: string | null
}

type UserWithGitHubDetails = GetUserDto & {
  gitHubDetails: GitHubUserDetails | null
}
```

Os campos externos serão mapeados desta forma:

- `login` → `login`
- `avatar_url` → `avatarUrl`
- `html_url` → `profileUrl`
- `bio` → `bio`

O payload completo da API externa não será repassado.

## Integração com GitHub

`GitHubService` ganhará um método para consultar `GET /users/{username}`. O username será codificado com `encodeURIComponent` antes de compor o caminho. O método mapeará uma resposta válida para `GitHubUserDetails` e retornará `null` para perfil inexistente, timeout ou qualquer outra falha. A falha será registrada pelo logger sem expor token, cabeçalhos de autorização ou outros dados sensíveis.

Essa integração usará a instância Axios já configurada com URL base, token, versão e timeout. Nenhum cache, retry ou novo cliente HTTP será adicionado nesta versão.

## Integração com usuários

`UsersModule` importará `GitHubModule`, e `UsersService` receberá `GitHubService` por injeção de dependência.

Uma função privada do serviço enriquecerá o DTO público já mapeado:

- `student`, `mentor` e `teacher` com `githubName` serão consultados.
- `admin` e registros sem `githubName` receberão `gitHubDetails: null` sem chamada externa.
- `findOne` enriquecerá o único usuário depois das verificações de existência e autorização.
- `findAll` mapeará e enriquecerá apenas os registros da página retornada, preservando `totalCount`, paginação, filtros e autorização atuais.
- As consultas de uma página serão iniciadas em paralelo para evitar latência sequencial.

Falhas individuais do GitHub não derrubarão a listagem nem a busca de detalhe; somente o usuário afetado receberá `gitHubDetails: null`.

## Tipos e compatibilidade

`GetUserDto.toDto` continuará responsável apenas pelos dados armazenados localmente. Um tipo enriquecido será usado por `GetUserOutput` e `ListUserOutput`. `UpsertUserOutput` continuará usando `GetUserDto`, preservando os retornos atuais de `register` e `update`.

O controller não fará composição de dados e não mudará suas rotas ou regras de acesso.

## Testes

Os testes de `GitHubService` cobrirão:

- chamada ao endpoint com username codificado;
- mapeamento de `login`, `avatar_url`, `html_url` e `bio`;
- retorno `null` quando a API falhar.

Os testes de `UsersService` cobrirão:

- `findOne` com detalhes do GitHub para um perfil elegível;
- `findAll` enriquecendo alunos, monitores e professores;
- `gitHubDetails: null` para administrador, username ausente e falha externa;
- preservação de paginação, autorização e DTO local.

O teste de módulo confirmará que `UsersModule` consegue resolver `GitHubService` por meio de `GitHubModule`. A suíte completa, lint e build da API serão executados após a implementação.

## Fora do escopo

- Cache ou persistência dos dados do GitHub.
- Retry de chamadas externas.
- Enriquecimento dos retornos de criação ou atualização.
- Exposição de outros campos do perfil do GitHub.
- Alterações no frontend para consumir ou exibir os novos dados.
