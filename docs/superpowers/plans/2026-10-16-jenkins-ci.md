# Jenkins CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provision Jenkins with Docker Compose and run path-aware CI for the CarecaHub API and Web applications.

**Architecture:** A root Compose file will run the existing PostgreSQL and Redis services alongside a persistent Jenkins controller. The controller image includes Git, Node.js 24 and pnpm; Jenkins Configuration as Code creates a credential-backed multibranch job that reads the repository `JenkinsFile` and validates changed API/Web applications in parallel.

**Tech Stack:** Docker Compose, Jenkins LTS (JDK 21), Jenkins Configuration as Code, Jenkins Job DSL, Node.js 24, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-10-16-jenkins-ci-design.md`

## Global Constraints

- Keep API, Web and docs as independent directories; do not add a workspace monorepo.
- All configuration and credentials come from environment variables; never commit or log secrets.
- The root Compose file preserves PostgreSQL and Redis service names, ports, volumes and network behavior.
- CI is limited to installation, lint, test and build; deploys and Docker socket mounts are out of scope.
- Use only the Jenkins plugins required for declarative/multibranch pipeline execution, Git checkout, credentials and JCasC/job provisioning.

## Review Focus

- Missing `.env.jenkins` must produce a clear Compose error rather than silently starting Jenkins without its administrator and Git configuration. Tested by the Compose configuration check in Task 1.
- Secret variables must exist only in `.env.jenkins` and Jenkins credentials, never in Compose, JCasC or repository output. Inspected in Task 2 and verified by a placeholder-only example in Task 1.
- The initial branch build must validate both applications, because it has no previous commit for a diff. Covered by the first-build branch path in Task 3.
- Pull-request builds must compare against the target branch rather than a local parent commit. Covered by the `CHANGE_TARGET` path in Task 3.
- A change limited to one application must not install or validate the other application. Covered by the API-only and Web-only pipeline change detection checks in Task 3.

---

### Task 1: Consolidate Compose and document Jenkins environment

**Files:**
- Create: `docker-compose.yaml`
- Create: `.env.jenkins.example`
- Create: `.gitignore`
- Modify: `README.md:3-7`
- Modify: `api/package.json:22`
- Delete: `api/compose.yaml`

**Interfaces:**
- Consumes: Existing `carecahub_db`, `carecahub_redis`, volumes and `carecahub_net` definitions from `api/compose.yaml`.
- Produces: `docker compose` commands that operate from the repository root and a `jenkins` service that builds `./jenkins`, exposes port `8080`, persists `jenkins_home`, loads `.env.jenkins`, and mounts `jenkins/casc.yaml` read-only at `/var/jenkins_config/casc.yaml`. `JENKINS_ENV_FILE` may override the environment-file path for safe example-file validation.

- [ ] **Step 1: Add a root Compose file that preserves the API dependency services and defines Jenkins**

Move the existing database, Redis, named-volume and network definitions unchanged into `docker-compose.yaml`. Add `jenkins` with `build: ./jenkins`, `container_name: carecahub_jenkins`, port `8080:8080`, `restart: unless-stopped`, volume `jenkins_home:/var/jenkins_home`, and the read-only JCasC mount. Its `env_file` must default to `.env.jenkins` and allow `JENKINS_ENV_FILE` to select `.env.jenkins.example` for validation. Configure `JAVA_OPTS=-Djenkins.install.runSetupWizard=false` and `CASC_JENKINS_CONFIG=/var/jenkins_config/casc.yaml`.

- [ ] **Step 2: Add the placeholder-only Jenkins environment template and ignore local environment files**

Create `.env.jenkins.example` with `JENKINS_ADMIN_ID`, `JENKINS_ADMIN_PASSWORD`, `GITHUB_OWNER`, `GITHUB_REPOSITORY`, `GITHUB_USER` and `GITHUB_TOKEN`. Add `.env.jenkins` to the root `.gitignore`; no real value belongs in either Compose or JCasC.

- [ ] **Step 3: Update root-facing Compose commands**

Change the README startup command from `docker compose -f api/compose.yaml up -d` to `docker compose up -d --build`. Change API's `db:clear` script to pass `-f ../docker-compose.yaml` so it continues to target the same service and volume after its Compose file moves.

- [ ] **Step 4: Validate the assembled Compose configuration**

Run: `JENKINS_ENV_FILE=.env.jenkins.example docker compose config`

Expected: exit code 0; services `carecahub_db`, `carecahub_redis` and `jenkins`, and volumes for PostgreSQL, Redis and Jenkins are rendered without credentials in versioned files.

- [ ] **Step 5: Commit the Compose migration**

```bash
git add docker-compose.yaml .env.jenkins.example .gitignore README.md api/package.json api/compose.yaml
git commit -m "ci: add Jenkins Compose environment"
```

### Task 2: Build and provision the Jenkins controller

**Files:**
- Create: `jenkins/Dockerfile`
- Create: `jenkins/plugins.txt`
- Create: `jenkins/casc.yaml`

**Interfaces:**
- Consumes: The root `jenkins` Compose service, variables from `.env.jenkins`, and repository pipeline path `JenkinsFile`.
- Produces: A Jenkins controller whose default executor has `git`, `node`, `corepack` and `pnpm`; a local administrator; a `github` username/password credential; and a `carecahub` multibranch job.

- [ ] **Step 1: Add the controller Dockerfile**

Base the final image on `jenkins/jenkins:lts-jdk21`. Install Git and copy Node.js 24 from the official Node image, then run `corepack enable` before returning to the `jenkins` user. Copy `plugins.txt` to `/usr/share/jenkins/ref/plugins.txt` and install it with `jenkins-plugin-cli`.

- [ ] **Step 2: Declare the minimal Jenkins plugins**

Create `jenkins/plugins.txt` with `workflow-aggregator`, `workflow-multibranch`, `git`, `credentials-binding`, `timestamper`, `github-branch-source`, `configuration-as-code` and `job-dsl`. Do not add deployment, container, cloud or UI-only plugins.

- [ ] **Step 3: Provision Jenkins through JCasC**

Create `jenkins/casc.yaml` that disables signup and anonymous access, creates the `${JENKINS_ADMIN_ID}` local user with `${JENKINS_ADMIN_PASSWORD}`, configures global `github` username/password credentials from `${GITHUB_USER}` and `${GITHUB_TOKEN}`, and creates the `carecahub` GitHub multibranch job from `${GITHUB_OWNER}` and `${GITHUB_REPOSITORY}`. Supply its GitHub URL as well because the Job DSL constructor requires it. Configure branch and origin pull-request discovery, `JenkinsFile` as its script path, one-hour periodic folder scanning, and retention of five orphaned branch jobs.

- [ ] **Step 4: Build the controller image and inspect installed runtime tools**

Run: `JENKINS_ENV_FILE=.env.jenkins.example docker compose build jenkins`

Expected: exit code 0, and build output includes successful pnpm enablement and Jenkins plugin installation.

- [ ] **Step 5: Start Jenkins and verify JCasC provisioning**

Run: `JENKINS_ENV_FILE=.env.jenkins.example docker compose up -d jenkins`

Expected: Jenkins starts without the setup wizard; its logs show JCasC loading, and the `carecahub` multibranch job is available after initialization.

- [ ] **Step 6: Commit Jenkins provisioning files**

```bash
git add jenkins/Dockerfile jenkins/plugins.txt jenkins/casc.yaml
git commit -m "ci: provision Jenkins controller"
```

### Task 3: Complete the path-aware API and Web CI pipeline

**Files:**
- Modify: `JenkinsFile:1-122`

**Interfaces:**
- Consumes: Jenkins' default executor from Task 2 and API/Web `pnpm` scripts.
- Produces: A declarative pipeline that checks out source, detects API/Web changes for pull requests, incremental branch builds and first branch builds, then validates only the affected application directories.

- [ ] **Step 1: Add change detection that covers pull requests and branch builds**

In the `Detect Changes` script, use `CHANGE_TARGET` and the bound Git credential to fetch and diff `origin/<target>...HEAD` for pull requests. For a normal build, diff from `GIT_PREVIOUS_SUCCESSFUL_COMMIT`; when no previous successful revision is available, list all tracked files. Set `API_CHANGED` and `WEB_CHANGED` imperatively according to the `api/` and `web/` prefixes, initializing both to `false` inside the script.

- [ ] **Step 2: Execute all API validation commands in the API directory**

Replace the API placeholder steps with `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` and `pnpm build`, each inside `dir('api')`.

- [ ] **Step 3: Execute all Web validation commands in the Web directory**

Replace the Web placeholder steps with `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` and `pnpm build`, each inside `dir('web')`.

- [ ] **Step 4: Use the built-in Jenkins executor for all stages**

Replace the unavailable `pnpm-node` label with `agent any` on each stage that needs an executor. Keep API and Web as parallel branches; no external agent image or Docker socket is introduced.

- [ ] **Step 5: Validate pipeline source and the commands it invokes**

Run: `rg -n "TODO|STEP [1-4]|pnpm-node" JenkinsFile`

Expected: no matches.

Run: `cd api && pnpm lint && pnpm test && pnpm build`

Expected: exit code 0.

Run: `cd web && pnpm lint && pnpm test && pnpm build`

Expected: exit code 0.

- [ ] **Step 6: Commit the completed pipeline**

```bash
git add JenkinsFile
git commit -m "ci: validate changed API and Web applications"
```
