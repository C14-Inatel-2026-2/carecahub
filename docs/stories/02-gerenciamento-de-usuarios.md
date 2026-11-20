# US-02 — Gerenciamento de usuários por papel (role)

Como administrador,
quero cadastrar, editar e desativar usuários com seus respectivos papéis,
para manter as pessoas que podem utilizar o CarecaHub organizadas.

## Critérios de aceite

- Dado que sou administrador, quando cadastro uma pessoa com nome, e-mail,
  senha e papel válidos, então a nova conta deve ficar disponível na lista de
  usuários.
- Dado que sou administrador, quando altero os dados de uma conta existente,
  então as informações atualizadas devem ser exibidas na plataforma.
- Dado que sou administrador, quando removo uma conta que não possui
  impedimentos, então ela não deve aparecer nas listagens ativas.
- Dado que sou professor ou monitor, quando consulto a lista de usuários,
  então devo visualizar apenas os alunos permitidos pelo meu papel e não devo
  receber ações administrativas.
- Dado que não sou administrador, quando tento criar, editar ou excluir uma
  conta, então a operação deve ser negada.
