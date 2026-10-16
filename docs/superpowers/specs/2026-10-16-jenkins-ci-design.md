# Jenkins CI para API e Web

## Objetivo

Disponibilizar uma instância local de Jenkins, reproduzível por Docker Compose,
que descubra os branches do repositório CarecaHub e execute a validação de CI
para as aplicações independentes `api/` e `web/`. A primeira entrega não
publicará imagens nem fará deploy.

## Estrutura

O arquivo `api/compose.yaml` será movido para `docker-compose.yaml` na raiz.
O mesmo Compose manterá os serviços PostgreSQL e Redis existentes e adicionará
o serviço `jenkins`. Assim, `docker compose up -d --build` na raiz sobe tanto
as dependências da API quanto o Jenkins.
O projeto Compose continuará se chamando `api`, preservando os rótulos e os
recursos padrão de instalações que já usavam `api/compose.yaml`.

O diretório raiz `jenkins/` conterá:

- `Dockerfile`, baseado em Jenkins LTS com JDK 21, Git, Node.js 24 e pnpm via
  Corepack, para que o controlador execute o CI sem agente adicional;
- `plugins.txt`, limitado aos plugins necessários para pipeline declarativo,
  timestamps, Git/GitHub, credenciais, job multibranch e Jenkins Configuration
  as Code (JCasC);
- `casc.yaml`, que configura autenticação local, credencial Git, e o job
  multibranch `carecahub`.

O Jenkins persistirá apenas `/var/jenkins_home` em volume nomeado. A
configuração JCasC será montada como somente leitura. Nenhum socket Docker será
montado porque o CI desta etapa não constrói imagens nem faz deploy.

## Configuração e segredos

`docker-compose.yaml` carregará `.env.jenkins`, que ficará ignorado pelo Git.
`.env.jenkins.example` documentará os valores necessários: usuário e senha do
administrador Jenkins, URL do repositório Git e, quando o repositório exigir
autenticação, usuário e token do Git. O exemplo conterá somente placeholders.

O `casc.yaml` referenciará essas variáveis, sem valores secretos próprios. Ele
receberá proprietário e nome do repositório GitHub para descobrir branches e
pull requests. A primeira inicialização dispensará o assistente interativo; o
acesso anônimo será desabilitado e usuários autenticados terão controle do
Jenkins local.

## Pipeline

O `JenkinsFile` existente continuará sendo a fonte da pipeline. Ele fará
checkout, detectará alterações em `api/` e `web/`, e executará em paralelo
somente as validações necessárias:

- API: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` e `pnpm build`;
- Web: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` e `pnpm build`.

Como o controlador contém as ferramentas de runtime, os estágios usarão o
executor padrão do Jenkins, sem depender do rótulo externo `pnpm-node`.
O cálculo de alterações deverá continuar funcional tanto em pull requests como
em branches, sem assumir que `CHANGE_TARGET` sempre existe. Branches usarão o
último commit bem-sucedido do Jenkins como base; a primeira execução validará
as duas aplicações.

## Compatibilidade da API

As instruções no `README.md` passarão a apontar para o Compose da raiz. O script
`api` que reinicializa o banco também passará a referenciar o arquivo raiz, para
preservar o comportamento após a movimentação.

## Verificação

Após a implementação serão executados:

- validação de sintaxe do Compose;
- build da imagem Jenkins;
- inspeção da configuração JCasC no container inicializado;
- lint, testes e build de API e Web pelos mesmos comandos da pipeline.

## Fora do escopo

- Deploy, publicação de imagens ou acesso ao Docker daemon pelo Jenkins.
- Configuração de webhooks externos; a descoberta periódica do job multibranch
  será suficiente nesta etapa.
- Alterar as credenciais de desenvolvimento já existentes ou adicioná-las ao
  controle de versão.
