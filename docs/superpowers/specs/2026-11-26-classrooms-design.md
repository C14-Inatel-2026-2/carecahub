# Gestão de Turmas por Semestre — Design

## Intenção

Substituir o texto livre de turma no cadastro por uma turma administrada, vinculada a um semestre e preservada como histórico. A equipe pedagógica (admin, professor e monitor) terá uma área de turmas para criá-las, acompanhar indicadores e arquivá-las ao fim do semestre. Atividades poderão ser destinadas a uma ou mais turmas, em vez de sempre alcançarem todos os grupos.

## Objetivos

- Uma turma possui nome, semestre no formato `YYYY.1` ou `YYYY.2`, datas de auditoria e estado ativo/arquivado.
- O aluno pertence diretamente a uma turma; arquivar a turma não remove nem altera esse vínculo.
- O cadastro público apresenta somente turmas ativas como opções obrigatórias.
- Admin, professor e monitor podem criar, consultar, detalhar e arquivar turmas; aluno não recebe rota, item de navegação ou acesso à API dessa área.
- A listagem mostra as turmas ativas do semestre e métricas resumidas; o detalhe apresenta métricas e atividades daquela turma.
- A criação/edição de atividade seleciona uma ou mais turmas ativas, formando sua audiência a partir dos grupos dessas turmas.

## Não objetivos

- Histórico de várias matrículas para a mesma pessoa em semestres distintos. Um aluno permanece associado à turma em que foi cadastrado.
- Reabrir ou excluir definitivamente uma turma arquivada.
- Persistir uma cópia dos commits do GitHub ou criar uma camada de cache para métricas.
- Alterar retroativamente a audiência de uma atividade já publicada ao mover dados antigos.

## Decisões e premissas

- A modelagem escolhida é um vínculo direto: `User.classroomId -> Classroom.id`. É suficiente porque alunos arquivados continuam na turma de origem e uma nova turma recebe a nova leva de alunos.
- A migração transforma os valores legados `User.classroom` em turmas do semestre `2026.2`, cria uma turma para cada código existente e relaciona os respectivos alunos. Depois, remove a coluna textual.
- Grupos pertencem a uma turma. Criar grupo e convidar participantes exige que todos sejam alunos da mesma turma, impedindo que uma entrega ou projeto atravesse turmas. Um grupo legado inconsistente é associado à turma do seu líder; grupos sem líder ou cujo líder não tem turma permanecem sem turma até correção administrativa.
- A migração preserva a audiência das atividades existentes: para cada par distinto de atividade e turma encontrado em `ActivityGroup -> Group.classroomId`, cria `ActivityClassroom`. Grupos sem turma não geram uma nova audiência de turma.
- Arquivamento é uma transição irreversível: marca `archivedAt`, mantém alunos/grupos/projetos/entregas consultáveis e bloqueia cadastro, novas atividades para a turma e alterações de composição.
- Todos os três papéis da equipe podem operar turmas, conforme o pedido de controle para admin/professor/monitor. As APIs continuam aplicando esta permissão no servidor, além da navegação do cliente.

## Modelo de dados

### Classroom

Tabela `Classroom`:

- `id` UUID primária;
- `name` texto de até 50 caracteres (por exemplo, `A` ou `T01`);
- `semester` texto validado por `^\\d{4}\\.[12]$`;
- `archivedAt` nulo enquanto ativa;
- `createdAt` e `updatedAt`;
- unicidade de `(semester, name)`.

`User` perde `classroom` textual e recebe `classroomId` anulável durante a migração, com chave estrangeira para `Classroom`. Para alunos recém-cadastrados, a aplicação exige o ID de uma turma ativa. Contas existentes sem código de turma continuam nulas até serem administradas manualmente.

`Group` recebe `classroomId`, preenchido a partir do criador/grupo legado. Projetos e repositórios já se relacionam ao grupo; atividades e entregas já se relacionam ao grupo, portanto não precisam duplicar a turma.

Tabela de junção `ActivityClassroom` conecta uma atividade a uma ou mais turmas, com unicidade por par. Ela é a fonte de autorização da atividade: um aluno vê atividades destinadas à sua turma mesmo sem participar de grupo. `ActivityGroup` continua registrando os grupos elegíveis para entrega; a publicação insere os grupos existentes das turmas-alvo, e a criação posterior de um grupo insere esse grupo nas atividades ainda abertas destinadas à sua turma.

## APIs e autorização

Novo recurso Nest `classrooms`, registrado em `AppModule`, com controller, service, interfaces e DTOs no padrão do repositório:

- `GET /classrooms?semester=&status=`: lista paginada para equipe, com resumo; o cadastro público usa uma variação pública limitada a turmas ativas.
- `GET /classrooms/:id`: detalhe e métricas da turma para equipe.
- `POST /classrooms`: cria turma ativa.
- `PATCH /classrooms/:id/archive`: arquiva turma ativa; falha se a turma já estiver arquivada.

O endpoint público de opções só retorna `id`, `name` e `semester` de turmas ativas. A API de registro passa a receber `classroomId`, verifica a existência/atividade da turma antes de gravar a solicitação pendente no cache e persiste o ID na confirmação.

`CreateActivityDto` recebe `classroomIds`; a audiência não pode ser alterada após a publicação, preservando seu histórico. Ao publicar, a API valida que todos os IDs são distintos, existem e estão ativos; cria `ActivityClassroom`; cria `ActivityGroup` para grupos ativos já existentes; e notifica os alunos ativos dessas turmas. Uma turma sem grupos ainda é uma audiência válida: seus alunos podem visualizar a atividade e poderão entregar quando formarem um grupo elegível.

## Métricas

Os indicadores da listagem são calculados no servidor por turma:

- alunos: alunos não removidos vinculados à turma;
- grupos: grupos ativos vinculados à turma;
- projetos: projetos não removidos de grupos da turma;
- entregas: percentual de pares `ActivityGroup` da turma que possuem uma entrega válida, contando cada atividade publicada para aquele grupo como denominador;
- commits: soma da contagem da branch padrão dos repositórios ativos dos projetos da turma, consultada pelo serviço GitHub já utilizado em projetos. Falhas do GitHub contribuem `0`, como no comportamento atual de projetos.

O detalhe inclui esses totais, quantidade de entregas no prazo/atrasadas, atividades destinadas à turma e sua taxa de entrega individual. Atividades arquivadas e turmas arquivadas permanecem nos indicadores históricos.

## Experiência web

- A rota `/classrooms` e `/classrooms/:classroomId` entra em `appRoutes`, `route-config`, controle de acesso e sidebar apenas para equipe.
- A página de listagem abre no semestre ativo, permite filtrar por semestre e estado, apresenta cartões de métricas/listagem e o botão superior direito **Cadastrar turma**.
- O cadastro de turma é um diálogo simples: nome e semestre; por padrão, o semestre é informado explicitamente, sem uma configuração global nova.
- Ao selecionar uma linha/cartão, a navegação abre **Detalhes da Turma**. O cabeçalho mostra nome/semestre e, no canto superior direito, **Arquivar turma** quando ativa. A confirmação explica que os vínculos e histórico serão preservados.
- O formulário público de cadastro carrega as opções ativas e usa um `Select` para `Turma`; quando não houver turma ativa, explica que não há inscrições disponíveis e não permite concluir o formulário.
- O compositor e o diálogo de atividade exibem um seletor de múltiplas turmas ativas; pelo menos uma é obrigatória.
- A tela administrativa de alunos substitui o texto de turma por seleção de turma para alunos e disponibiliza filtro por turma. O filtro é enviado à lista de usuários e ao endpoint de analytics, para que os cartões reflitam exatamente a turma selecionada.

## Estratégias consideradas

1. Vínculo direto `User -> Classroom` — escolhido por satisfazer o histórico imutável solicitado com o menor modelo possível.
2. Tabela de matrículas históricas — descartada porque só seria necessária se o mesmo aluno pudesse cursar a disciplina novamente em outro semestre; isso não foi requisitado e adicionaria gestão de matrículas e transições.

## Restrições

- Manter Drizzle/PostgreSQL, Nest e React/SWR existentes; sem bibliotecas novas.
- Manter a validação de autorização no backend e o controle de rota no frontend.
- Sem credenciais, mocks da API no frontend ou abstrações genéricas novas.
- Testar comportamento observável: limites de papel, turmas arquivadas fora do cadastro, integridade da audiência de atividades e agregações de métricas.
