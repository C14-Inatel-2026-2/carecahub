# US-01 — Autenticação de acesso

Como pessoa usuária do CarecaHub,
quero entrar na plataforma com minhas credenciais,
para acessar os recursos compatíveis com meu perfil.

## Critérios de aceite

- Dado que informo um e-mail e uma senha válidos, quando envio o formulário de
  login, então devo ser autenticado e direcionado à área protegida da
  plataforma.
- Dado que informo credenciais inválidas, quando tento entrar, então devo ver
  uma mensagem de erro sem receber acesso à área protegida.
- Dado que estou autenticado, quando encerro a sessão, então não devo mais
  conseguir acessar rotas protegidas sem entrar novamente.
- Dado que conheço minha senha atual, quando informo uma nova senha válida,
  então a senha de acesso deve ser atualizada.
