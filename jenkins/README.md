# Jenkins: CI e relatórios de testes

Abra o Docker Desktop com containers Linux. Na raiz do repositório, copie
`jenkins/.env.example` para `jenkins/.env` caso ele ainda não exista. Preencha
as credenciais locais e os dados reais do repositório, sem versionar o `.env`.

```powershell
docker compose up -d --build jenkins
docker compose logs -f jenkins
```

Acesse http://localhost:8080 com o usuário e a senha definidos no `.env`.
O job `carecahub` é criado pela configuração `jenkins/casc.yaml`. Use
**Scan Multibranch Pipeline Now** para descobrir branches e PRs. Abra a branch
ou PR desejada e execute **Build Now**.

A descoberta de todas as branches está ativada (`gitHubBranchDiscovery`
com `strategyId(3)`). O job também descobre PRs de branches deste repositório,
mantendo `gitHubPullRequestDiscovery` com `strategyId(1)`.
Para aplicar uma alteração em `casc.yaml`, execute `docker compose restart jenkins`
na raiz e faça um novo **Scan Multibranch Pipeline Now**. Abra a branch
desejada ou um job `PR-...`.

O Jenkins lê `JenkinsFile` do Git remoto. Alterações apenas no disco não são
usadas pelo job; para validar esta versão nele, ela precisa estar na branch
remota selecionada. A reconstrução da imagem instala o plugin JUnit.

A pipeline usa `agent any` e os stages herdam o mesmo agente e workspace,
sem exigir o label `pnpm-node`. O checkout automático foi desativado porque
o stage Checkout já executa `checkout scm`. Setup pnpm verifica a versão
instalada, sem executar `corepack enable`.

A detecção de mudanças por `CHANGE_TARGET` e os stages dos colegas foram
preservados. Sem `CHANGE_TARGET`, builds de branch validam API e WEB.
Em PRs, os arquivos alterados determinam quais aplicações serão validadas.
As flags são atribuídas no script, sem valores fixos no bloco `environment`
que impeçam sua atualização. Cada aplicação selecionada executa instalação, lint,
testes e build. A imagem fornece Node 24 e pnpm 11.17.0 diretamente.
A pipeline completa ainda não foi validada no Jenkins.

Os testes geram `api/reports/junit.xml` e `web/reports/junit.xml`. O Jenkins
publica os resultados em **Test Result**, inclusive se algum teste falhar.
Antes de testar, limpa apenas a pasta de relatórios da aplicação para não
publicar resultados de uma execução antiga. Se instalação ou lint falhar,
os testes seguintes daquela aplicação não serão executados.

Estes são relatórios de resultados de testes; cobertura de código não foi
configurada.

## Deploy no Render

O deploy roda depois de instalação, lint, testes e build. No job da branch
`main`, use **Build with Parameters** e marque `DEPLOY_RENDER`. O parâmetro
vem desmarcado. PRs e demais branches executam apenas a validação.
Se o Jenkins ainda não mostrar o parâmetro, execute primeiro um build da
branch para carregar a configuração da pipeline.

Em **Manage Jenkins → Credentials**, adicione as credenciais abaixo. Os serviços
precisam estar no workspace Render acessível à chave.

| ID da credencial no Jenkins | Tipo | Valor |
| --- | --- | --- |
| `supabase-database-url` | Secret text | URI do Session pooler (porta `5432`) com a senha codificada para URL e `?sslmode=verify-full` |
| `supabase-database-ca` | Secret file | Certificado `prod-ca-2021.crt` baixado do Supabase |
| `render-api-key` | Secret text | Chave de API do Render |
| `render-api-service-id` | Secret text | ID do Web Service da API |
| `render-web-service-id` | Secret text | ID do Static Site do frontend |

A URI no Jenkins usa o certificado enviado como **Secret file**. Remova o
parâmetro `sslrootcert` da URI se você copiar o valor do Render, porque o caminho
`/etc/secrets/prod-ca-2021.crt` existe no Render. O Jenkins fornece seu próprio
arquivo ao Node e mantém a verificação TLS.

Na `main`, depois da validação, o Jenkins roda `pnpm db:migrate` na pasta `api`.
O Drizzle aplica somente migrations pendentes. Se a migration falhar, a etapa
de publicação não roda. O seed é executado separadamente. Como a versão anterior
da API continua atendendo durante o deploy, mantenha as migrations compatíveis
com ela até a nova versão ficar disponível.

Mantenha os dois serviços do Render apontados para o mesmo repositório público
que o Jenkins usa. Desative **Auto-Deploy** se estiver disponível. O Jenkins
solicita ao Render o SHA exato que validou, aguarda a API ficar **Live** e
então publica e acompanha o frontend. O Render precisa conseguir acessar o SHA
no GitHub. Faça o merge da branch de deploy na `main` para usar a etapa de
publicação.

As configurações de ambiente ficam no Render. Para ativar o Supabase Storage
na API com esta versão, preencha `AWS_S3_ENDPOINT` e `AWS_REGION` com os dados
da tela **Storage → Configuration → S3**. Defina `AWS_PUBLIC_BUCKET_URL` como
`https://PROJECT_REF.supabase.co/storage/v1/object/public/carecahub-public`,
`AWS_PUBLIC_BUCKET` como `carecahub-public` e `AWS_PRIVATE_BUCKET` como
`carecahub-private`. Use o par de chaves S3 do Supabase em `AWS_ACCESS_KEY_ID`
e `AWS_SECRET_ACCESS_KEY`.

Para parar sem apagar o histórico:

```powershell
docker compose stop jenkins
```
