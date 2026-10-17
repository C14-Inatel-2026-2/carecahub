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

A estrutura original do `JenkinsFile` foi preservada: `agent none`, o label
`pnpm-node` e a detecção de mudanças por `CHANGE_TARGET` continuam presentes.
Os ajustes no arquivo se limitam aos testes, aos relatórios e ao build da API.
Cada aplicação selecionada executa instalação, lint, testes e build.

Essas condições originais ainda exigem correção ou configuração pelo grupo:
checkout e setup usam comandos que precisam de agente, `corepack enable`
precisa de Corepack instalado e permissão de escrita, o label `pnpm-node`
precisa existir, e `CHANGE_TARGET` normalmente só existe em builds de PR.
A imagem fornece Node 24 e pnpm 11.17.0 diretamente. A pipeline completa
ainda não foi validada no Jenkins; gerar XML localmente não valida esses pontos.

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
