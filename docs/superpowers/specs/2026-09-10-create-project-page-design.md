# Página de criação de projeto

## Objetivo

Criar uma página protegida em `/my-project/create` para estudantes cadastrarem os dados iniciais de um projeto. Nesta primeira versão, o envio será apenas local: o formulário será validado, uma notificação de sucesso será exibida e o usuário retornará para `/my-project`. Não haverá integração com a API nem persistência.

## Rotas e acesso

- Adicionar `createMyProject: "/my-project/create"` a `appRoutes`.
- Registrar `CreateProjectPage` no roteador autenticado.
- Incluir a nova rota nas páginas permitidas para o papel `student`.
- Alterar o botão "Criar projeto" de `MyProjectPage` para navegar até a nova rota.
- O arquivo principal da tela será `web/src/modules/my-project/create-project-page.tsx`.

## Formulário

O formulário usará `react-hook-form` com um schema Zod em `web/src/types/project.ts`, seguindo o padrão atual do frontend. Ele terá os seguintes campos:

- Nome do projeto: texto obrigatório.
- Descrição: texto longo obrigatório.
- Tecnologias utilizadas: seleção múltipla em uma lista fixa extensa, organizada visualmente para continuar responsiva.
- Outra tecnologia: a opção "Outra" exibe um campo de texto. Quando selecionada, a tecnologia personalizada passa a ser obrigatória.
- Gerenciador de dependências: seleção única entre npm, pnpm, Yarn, Bun, Maven, Gradle, pip, Poetry, Composer, NuGet, Cargo e Go Modules.
- Sistema de controle de versão: seleção única entre Git, Mercurial e Subversion.
- Tipo de repositório: seleção única entre Monorepo e Multirepo.

A lista fixa de tecnologias abrangerá opções comuns de frontend, backend, linguagens, bancos de dados, mobile, infraestrutura, cloud e ferramentas. As opções serão constantes simples, sem criar um sistema genérico de catálogo.

## Layout e responsividade

A página terá um botão "← Voltar" no canto superior esquerdo, seguido pelo título, descrição da tela e formulário. Serão usados os componentes shadcn/Tailwind existentes, sem animações decorativas nem um novo sistema visual.

Em telas estreitas, os controles ocuparão uma coluna. Grupos de opções poderão ganhar mais colunas progressivamente em telas maiores, mantendo rótulos legíveis e áreas de clique adequadas. As ações do formulário permanecerão acessíveis ao final do conteúdo.

## Voltar e descarte

O estado `isDirty` do `react-hook-form` indicará se qualquer valor foi alterado:

- Formulário intacto: "← Voltar" navega imediatamente para `/my-project`.
- Formulário alterado: "← Voltar" abre um diálogo central de confirmação.
- "Continuar editando" fecha o diálogo sem perder os valores.
- "Descartar e voltar" descarta os valores locais e navega para `/my-project`.

Esta confirmação será aplicada ao botão explícito da página. Interceptação do botão do navegador, recarregamento ou fechamento da aba fica fora do escopo desta versão.

## Envio, validação e erros

Ao enviar, o schema validará os campos obrigatórios e a condição da tecnologia personalizada. Erros serão exibidos junto aos respectivos campos usando os componentes de formulário existentes. Com dados válidos, a página exibirá uma notificação de sucesso e navegará para `/my-project`.

Como não há chamada de rede, não haverá estado de erro de API, retry ou armazenamento temporário.

## Testes

Testes focados validarão o comportamento observável do schema:

- aceita um projeto preenchido corretamente;
- rejeita campos obrigatórios ausentes;
- exige o texto da tecnologia personalizada quando "Outra" estiver selecionada;
- produz os valores tipados esperados para as seleções.

A tipagem do frontend, a suíte existente e o build disponível serão executados após a implementação. A navegação e o diálogo serão mantidos diretos, sem introduzir uma nova infraestrutura de testes de componentes apenas para esta página.

## Fora do escopo

- Integração com API e persistência.
- Edição de projetos existentes.
- Catálogo remoto de tecnologias.
- Criação de tecnologias reutilizáveis por outros usuários.
- Bloqueio de navegação pelo navegador ou fechamento da aba.
