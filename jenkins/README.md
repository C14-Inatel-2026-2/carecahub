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

O Jenkins lê `JenkinsFile` do Git remoto. Alterações apenas no disco não são
usadas pelo job; para validar esta versão nele, ela precisa estar na branch
remota selecionada. A reconstrução da imagem instala o plugin JUnit.

A pipeline usa `agent any` e os stages herdam o mesmo agente e workspace,
sem exigir o label `pnpm-node`. O checkout automático foi desativado porque
o stage Checkout já executa `checkout scm`. Setup pnpm verifica a versão
instalada, sem executar `corepack enable`.

A detecção de mudanças por `CHANGE_TARGET` e os stages dos colegas foram
preservados. Execute por um job de PR: essa variável normalmente não existe
em builds de branch. Cada aplicação selecionada executa instalação, lint,
testes e build. A imagem fornece Node 24 e pnpm 11.17.0 diretamente.
A pipeline completa ainda não foi validada no Jenkins.

Os testes geram `api/reports/junit.xml` e `web/reports/junit.xml`. O Jenkins
publica os resultados em **Test Result**, inclusive se algum teste falhar.
Antes de testar, limpa apenas a pasta de relatórios da aplicação para não
publicar resultados de uma execução antiga. Se instalação ou lint falhar,
os testes seguintes daquela aplicação não serão executados.

Estes são relatórios de resultados de testes; cobertura de código não foi
configurada. A pipeline não contém deploy.

Para parar sem apagar o histórico:

```powershell
docker compose stop jenkins
```
