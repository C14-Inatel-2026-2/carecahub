import { setTimeout as delay } from 'node:timers/promises'

const commitId = process.argv[2]
const { RENDER_API_KEY, RENDER_API_SERVICE_ID, RENDER_WEB_SERVICE_ID } = process.env
const pending = new Set([
  'created',
  'queued',
  'build_in_progress',
  'pre_deploy_in_progress',
  'update_in_progress',
])

async function renderRequest(path, options) {
  const response = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`${options?.method ?? 'GET'} ${path}: HTTP ${response.status}`)
  }

  return response.json()
}

async function deploy(name, serviceId) {
  const deploysPath = `/services/${encodeURIComponent(serviceId)}/deploys`
  const { id } = await renderRequest(deploysPath, {
    method: 'POST',
    body: JSON.stringify({ commitId }),
  })

  if (!id) throw new Error(`${name}: Render não retornou o ID do deploy`)
  console.log(`${name}: deploy ${id} iniciado para ${commitId}`)

  while (true) {
    const { status } = await renderRequest(`${deploysPath}/${encodeURIComponent(id)}`)
    if (status === 'live') {
      console.log(`${name}: deploy ${id} está Live`)
      return
    }
    if (!pending.has(status)) throw new Error(`${name}: deploy ${id} terminou com status ${status}`)
    await delay(10_000)
  }
}

try {
  if (!/^[0-9a-f]{40}$/.test(commitId ?? '')) throw new Error('Informe o SHA completo do commit')
  if (!RENDER_API_KEY || !RENDER_API_SERVICE_ID || !RENDER_WEB_SERVICE_ID) {
    throw new Error('Configure a chave da API do Render e os IDs dos dois serviços')
  }
  if (RENDER_API_SERVICE_ID === RENDER_WEB_SERVICE_ID) {
    throw new Error('Use IDs de serviços diferentes para a API e o frontend')
  }

  await deploy('API', RENDER_API_SERVICE_ID)
  await deploy('Frontend', RENDER_WEB_SERVICE_ID)
} catch (error) {
  console.error(`Falha no deploy pelo Jenkins: ${error.message}`)
  process.exitCode = 1
}
