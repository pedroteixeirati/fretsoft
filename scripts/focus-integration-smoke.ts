import 'dotenv/config';

type JsonObject = Record<string, unknown>;

type FiscalDocument = {
  id: string;
  documentType: 'cte' | 'cte_os' | 'mdfe';
  series: string;
  number: string;
  status: string;
  accessKey?: string;
  protocol?: string;
  xml?: string;
  dacteUrl?: string;
  providerDocumentId?: string;
  mdfeData?: Record<string, unknown>;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function env(name: string, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function requiredEnv(name: string) {
  const value = env(name);
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

function digits(value: string) {
  return value.replace(/\D/g, '');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function randomNumber(prefix: string) {
  const suffix = Date.now().toString().slice(-7);
  return `${prefix}${suffix}`.slice(0, 20);
}

const apiBaseUrl = env('FRETSOFT_API_BASE_URL', 'http://localhost:3001').replace(/\/$/, '');
const apiToken = requiredEnv('FRETSOFT_API_TOKEN');
const nfeKey = digits(requiredEnv('FOCUS_SMOKE_NFE_KEY'));
const runId = env('FOCUS_SMOKE_RUN_ID', Date.now().toString());
const pollAttempts = Number(env('FOCUS_SMOKE_POLL_ATTEMPTS', '18'));
const pollIntervalMs = Number(env('FOCUS_SMOKE_POLL_INTERVAL_MS', '5000'));
const closeMdfe = env('FOCUS_SMOKE_CLOSE_MDFE', 'false').toLowerCase() === 'true';

if (nfeKey.length !== 44) {
  throw new Error('FOCUS_SMOKE_NFE_KEY deve conter uma chave de NF-e com 44 digitos.');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path} falhou (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload as T;
}

async function step<T>(name: string, fn: () => Promise<T>) {
  const startedAt = Date.now();
  process.stdout.write(`\n[smoke] ${name}... `);
  try {
    const result = await fn();
    process.stdout.write(`ok (${Date.now() - startedAt}ms)\n`);
    return result;
  } catch (error) {
    process.stdout.write('falhou\n');
    throw error;
  }
}

function party(role: 'sender' | 'recipient', suffix: string) {
  return {
    role,
    name: env(`FOCUS_SMOKE_${suffix}_NAME`, suffix === 'SENDER' ? 'REMETENTE HOMOLOGACAO' : 'DESTINATARIO HOMOLOGACAO'),
    documentNumber: digits(env(`FOCUS_SMOKE_${suffix}_DOCUMENT`, suffix === 'SENDER' ? '11222333000181' : '22333444000192')),
    stateRegistration: env(`FOCUS_SMOKE_${suffix}_IE`, 'ISENTO'),
    city: env(`FOCUS_SMOKE_${suffix}_CITY`, suffix === 'SENDER' ? 'Contagem' : 'Betim'),
    state: env(`FOCUS_SMOKE_${suffix}_UF`, 'MG'),
    phone: env(`FOCUS_SMOKE_${suffix}_PHONE`, '3133334444'),
    street: env(`FOCUS_SMOKE_${suffix}_STREET`, 'Rua Homologacao'),
    number: env(`FOCUS_SMOKE_${suffix}_NUMBER`, '100'),
    district: env(`FOCUS_SMOKE_${suffix}_DISTRICT`, 'Centro'),
    zipCode: digits(env(`FOCUS_SMOKE_${suffix}_ZIP`, suffix === 'SENDER' ? '32000000' : '32600000')),
    cityIbgeCode: digits(env(`FOCUS_SMOKE_${suffix}_IBGE`, suffix === 'SENDER' ? '3118601' : '3106705')),
  };
}

function commonPayment() {
  return {
    payeeName: env('FOCUS_SMOKE_TAC_NAME', 'MOTORISTA HOMOLOGACAO'),
    payeeDocument: digits(env('FOCUS_SMOKE_TAC_DOCUMENT', '12345678909')),
    componentType: '04',
    amount: Number(env('FOCUS_SMOKE_AMOUNT', '100')),
    bankName: env('FOCUS_SMOKE_TAC_BANK', 'Banco Homologacao'),
    bankBranch: env('FOCUS_SMOKE_TAC_BRANCH', '0001'),
    bankAccount: env('FOCUS_SMOKE_TAC_ACCOUNT', '12345-6'),
    pixKey: env('FOCUS_SMOKE_TAC_PIX', '12345678909'),
  };
}

function ctePayload(): JsonObject {
  const originCity = env('FOCUS_SMOKE_ORIGIN_CITY', 'Contagem');
  const destinationCity = env('FOCUS_SMOKE_DESTINATION_CITY', 'Betim');
  return {
    documentType: 'cte',
    model: '57',
    series: env('FOCUS_SMOKE_CTE_SERIES', '1'),
    number: randomNumber('57'),
    issueDate: today(),
    amount: Number(env('FOCUS_SMOKE_AMOUNT', '100')),
    originName: originCity,
    destinationName: destinationCity,
    takerName: env('FOCUS_SMOKE_TAKER_NAME', 'DESTINATARIO HOMOLOGACAO'),
    executionMode: 'third_party',
    ciot: digits(requiredEnv('FOCUS_SMOKE_CIOT')),
    rntrc: digits(requiredEnv('FOCUS_SMOKE_RNTRC')),
    notes: `Smoke Focus NFe ${runId}`,
    cteData: {
      tomadorTipo: env('FOCUS_SMOKE_TAKER_TYPE', 'destinatario'),
      naturezaOperacao: 'PRESTACAO DE SERVICO DE TRANSPORTE',
      cfop: env('FOCUS_SMOKE_CFOP', '5353'),
      tipoServico: '0',
      icmsCst: env('FOCUS_SMOKE_ICMS_CST', '40'),
      produtoPredominante: env('FOCUS_SMOKE_PRODUCT', 'CARGA SECA'),
      valorCarga: Number(env('FOCUS_SMOKE_AMOUNT', '100')),
      municipioInicioIbge: digits(env('FOCUS_SMOKE_ORIGIN_IBGE', '3118601')),
      municipioFimIbge: digits(env('FOCUS_SMOKE_DESTINATION_IBGE', '3106705')),
      nfeKeys: [nfeKey],
    },
    taxData: {
      uf_envio: env('FOCUS_SMOKE_ORIGIN_UF', 'MG'),
      uf_inicio: env('FOCUS_SMOKE_ORIGIN_UF', 'MG'),
      uf_fim: env('FOCUS_SMOKE_DESTINATION_UF', 'MG'),
      municipio_envio: originCity,
      municipio_inicio: originCity,
      municipio_fim: destinationCity,
      codigo_municipio_envio: digits(env('FOCUS_SMOKE_ORIGIN_IBGE', '3118601')),
      codigo_municipio_inicio: digits(env('FOCUS_SMOKE_ORIGIN_IBGE', '3118601')),
      codigo_municipio_fim: digits(env('FOCUS_SMOKE_DESTINATION_IBGE', '3106705')),
      indicador_inscricao_estadual_tomador: env('FOCUS_SMOKE_TAKER_IE_INDICATOR', '9'),
    },
    parties: [party('sender', 'SENDER'), party('recipient', 'RECIPIENT')],
    payments: [commonPayment()],
  };
}

function mdfePayload(cte: FiscalDocument): JsonObject {
  return {
    documentType: 'mdfe',
    model: '58',
    series: env('FOCUS_SMOKE_MDFE_SERIES', '1'),
    number: randomNumber('58'),
    issueDate: today(),
    amount: Number(env('FOCUS_SMOKE_AMOUNT', '100')),
    originName: env('FOCUS_SMOKE_ORIGIN_CITY', 'Contagem'),
    destinationName: env('FOCUS_SMOKE_DESTINATION_CITY', 'Betim'),
    takerName: env('FOCUS_SMOKE_TAKER_NAME', 'DESTINATARIO HOMOLOGACAO'),
    executionMode: 'third_party',
    ciot: digits(requiredEnv('FOCUS_SMOKE_CIOT')),
    rntrc: digits(requiredEnv('FOCUS_SMOKE_RNTRC')),
    notes: `Smoke Focus NFe ${runId}`,
    mdfeData: {
      vehiclePlate: env('FOCUS_SMOKE_VEHICLE_PLATE', 'ABC1D23'),
      vehicleRenavam: digits(requiredEnv('FOCUS_SMOKE_VEHICLE_RENAVAM')),
      vehicleUf: env('FOCUS_SMOKE_VEHICLE_UF', 'MG'),
      vehicleTara: Number(env('FOCUS_SMOKE_VEHICLE_TARA', '8000')),
      condutorNome: env('FOCUS_SMOKE_DRIVER_NAME', 'MOTORISTA HOMOLOGACAO'),
      condutorCpf: digits(requiredEnv('FOCUS_SMOKE_DRIVER_CPF')),
      ufInicio: env('FOCUS_SMOKE_ORIGIN_UF', 'MG'),
      ufFim: env('FOCUS_SMOKE_DESTINATION_UF', 'MG'),
      cteKeys: [cte.accessKey],
      municipioFimIbge: digits(env('FOCUS_SMOKE_DESTINATION_IBGE', '3106705')),
      pesoTotal: Number(env('FOCUS_SMOKE_WEIGHT', '1000')),
      valorTotal: Number(env('FOCUS_SMOKE_AMOUNT', '100')),
      produtoPredominante: env('FOCUS_SMOKE_PRODUCT', 'CARGA SECA'),
      produtoNcm: digits(env('FOCUS_SMOKE_PRODUCT_NCM', '00000000')),
      contratanteNome: env('FOCUS_SMOKE_TAKER_NAME', 'DESTINATARIO HOMOLOGACAO'),
      contratanteDocumento: digits(env('FOCUS_SMOKE_TAKER_DOCUMENT', env('FOCUS_SMOKE_RECIPIENT_DOCUMENT', '22333444000192'))),
      cepCarregamento: digits(env('FOCUS_SMOKE_ORIGIN_ZIP', '32000000')),
      cepDescarregamento: digits(env('FOCUS_SMOKE_DESTINATION_ZIP', '32600000')),
    },
    taxData: {
      municipios_carregamento: [{
        codigo: digits(env('FOCUS_SMOKE_ORIGIN_IBGE', '3118601')),
        nome: env('FOCUS_SMOKE_ORIGIN_CITY', 'Contagem'),
      }],
      municipios_descarregamento: [{
        codigo: digits(env('FOCUS_SMOKE_DESTINATION_IBGE', '3106705')),
        nome: env('FOCUS_SMOKE_DESTINATION_CITY', 'Betim'),
      }],
    },
    payments: [commonPayment()],
  };
}

async function pollAuthorized(document: FiscalDocument, label: string) {
  let current = document;
  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    current = await request<FiscalDocument>('POST', `/api/fiscal/documents/${document.id}/sync`);
    console.log(`[smoke] ${label} tentativa ${attempt}/${pollAttempts}: status=${current.status} chave=${current.accessKey || '-'}`);
    if (current.status === 'authorized') return current;
    if (['rejected', 'denied', 'error', 'canceled'].includes(current.status)) {
      throw new Error(`${label} terminou com status ${current.status}. Consulte logs em /api/fiscal/documents/${document.id}/logs.`);
    }
    await sleep(pollIntervalMs);
  }
  throw new Error(`${label} nao autorizou apos ${pollAttempts} tentativas.`);
}

function assertAuthorizedDocument(document: FiscalDocument, label: string) {
  if (document.status !== 'authorized') throw new Error(`${label} nao esta autorizado.`);
  if (!document.accessKey || digits(document.accessKey).length !== 44) throw new Error(`${label} sem chave fiscal valida.`);
  if (!document.protocol) throw new Error(`${label} sem protocolo.`);
  if (!document.xml) throw new Error(`${label} sem XML.`);
  if (!document.dacteUrl) throw new Error(`${label} sem PDF/DACTE/DAMDFE.`);
}

async function main() {
  console.log(`[smoke] Base API: ${apiBaseUrl}`);
  console.log(`[smoke] Run ID: ${runId}`);

  const cte = await step('Criar CT-e', () => request<FiscalDocument>('POST', '/api/fiscal/documents', ctePayload()));
  await step('Emitir CT-e', () => request<FiscalDocument>('POST', `/api/fiscal/documents/${cte.id}/emit`));
  const authorizedCte = await step('Consultar CT-e ate autorizar', () => pollAuthorized(cte, 'CT-e'));
  assertAuthorizedDocument(authorizedCte, 'CT-e');

  const mdfe = await step('Criar MDF-e com chave do CT-e', () => request<FiscalDocument>('POST', '/api/fiscal/documents', mdfePayload(authorizedCte)));
  await step('Emitir MDF-e', () => request<FiscalDocument>('POST', `/api/fiscal/documents/${mdfe.id}/emit`));
  const authorizedMdfe = await step('Consultar MDF-e ate autorizar', () => pollAuthorized(mdfe, 'MDF-e'));
  assertAuthorizedDocument(authorizedMdfe, 'MDF-e');

  if (closeMdfe) {
    await step('Encerrar MDF-e', () => request<FiscalDocument>('POST', `/api/fiscal/documents/${authorizedMdfe.id}/close`));
  } else {
    console.log('\n[smoke] Encerramento de MDF-e pulado. Use FOCUS_SMOKE_CLOSE_MDFE=true para testar esta etapa.');
  }

  const cteLogs = await step('Consultar logs do CT-e', () => request<unknown[]>('GET', `/api/fiscal/documents/${authorizedCte.id}/logs`));
  const mdfeLogs = await step('Consultar logs do MDF-e', () => request<unknown[]>('GET', `/api/fiscal/documents/${authorizedMdfe.id}/logs`));
  const mdfeEvents = await step('Consultar eventos do MDF-e', () => request<unknown[]>('GET', `/api/fiscal/documents/${authorizedMdfe.id}/events`));

  console.log('\n[smoke] Resultado');
  console.log(JSON.stringify({
    cte: {
      id: authorizedCte.id,
      status: authorizedCte.status,
      accessKey: authorizedCte.accessKey,
      protocol: authorizedCte.protocol,
      xml: authorizedCte.xml,
      dacteUrl: authorizedCte.dacteUrl,
      logs: cteLogs.length,
    },
    mdfe: {
      id: authorizedMdfe.id,
      status: authorizedMdfe.status,
      accessKey: authorizedMdfe.accessKey,
      protocol: authorizedMdfe.protocol,
      xml: authorizedMdfe.xml,
      damdfeUrl: authorizedMdfe.dacteUrl,
      logs: mdfeLogs.length,
      events: mdfeEvents.length,
      closeTested: closeMdfe,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error('\n[smoke] Falha no smoke test Focus NFe');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
