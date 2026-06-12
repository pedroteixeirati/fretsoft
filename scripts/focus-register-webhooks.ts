import 'dotenv/config';

type FocusHook = {
  id?: string;
  url?: string;
  authorization?: string | null;
  authorization_header?: string | null;
  event?: string;
  cnpj?: string;
};

const events = ['cte', 'mdfe'] as const;

function env(name: string, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function requiredEnv(name: string) {
  const value = env(name);
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${name}`);
  return value;
}

function digits(value: string) {
  return value.replace(/\D/g, '');
}

function focusBaseUrl() {
  const configured = env('FOCUS_NFE_BASE_URL');
  if (configured) return configured.replace(/\/$/, '');
  return env('FOCUS_NFE_ENV', 'homologacao').toLowerCase() === 'producao'
    ? 'https://api.focusnfe.com.br/v2'
    : 'https://homologacao.focusnfe.com.br/v2';
}

function authHeader(token: string) {
  return `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
}

async function createHook(event: typeof events[number]) {
  const token = requiredEnv('FOCUS_NFE_TOKEN');
  const cnpj = digits(requiredEnv('FOCUS_WEBHOOK_CNPJ'));
  const publicBaseUrl = requiredEnv('FRETSOFT_PUBLIC_API_BASE_URL').replace(/\/$/, '');
  const authorization = requiredEnv('FOCUS_NFE_WEBHOOK_AUTHORIZATION');
  const authorizationHeader = env('FOCUS_NFE_WEBHOOK_AUTHORIZATION_HEADER', 'authorization');
  const url = `${publicBaseUrl}/api/fiscal/webhooks/focus/${event}`;
  const body = {
    cnpj,
    event,
    url,
    authorization,
    authorization_header: authorizationHeader,
  };

  const response = await fetch(`${focusBaseUrl()}/hooks`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Falha ao criar webhook ${event} (${response.status}): ${JSON.stringify(payload)}`);
  }

  return payload as FocusHook;
}

function redactHook(hook: FocusHook) {
  return {
    ...hook,
    authorization: hook.authorization ? '***' : hook.authorization,
  };
}

async function main() {
  console.log(`[focus:webhooks] Ambiente: ${focusBaseUrl()}`);
  const created: FocusHook[] = [];
  for (const event of events) {
    process.stdout.write(`[focus:webhooks] Criando webhook ${event}... `);
    const hook = await createHook(event);
    created.push(hook);
    process.stdout.write(`ok (${hook.id || 'sem-id'})\n`);
  }

  console.log('\n[focus:webhooks] Webhooks criados');
  console.log(JSON.stringify(created.map(redactHook), null, 2));
}

main().catch((error) => {
  console.error('\n[focus:webhooks] Falha ao configurar webhooks');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
