import { fiscalErrors } from '../errors/fiscal.errors';

// Fluxo de NFS-e isolado do CT-e/MDF-e. Reusa apenas a configuracao de ambiente
// da Focus (mesmo token/base URL), sem acoplar ao adapter de documentos de transporte.

export interface NfsePartyInput {
  document: string;
  name: string;
  email?: string;
  municipalRegistration?: string;
  street?: string;
  number?: string;
  district?: string;
  cityIbgeCode?: string;
  state?: string;
  zipCode?: string;
}

export interface NfseEmitInput {
  reference: string;
  issueDate: string;
  prestador: {
    cnpj: string;
    municipalRegistration: string;
    cityIbgeCode: string;
  };
  tomador: NfsePartyInput;
  servico: {
    issRate: number | null;
    description: string;
    issRetained: boolean;
    serviceListItem: string;
    serviceCode: string;
    cnaeCode: string;
    amount: number;
    cityIbgeCode: string;
  };
}

export interface NfseProviderResponse {
  status: 'processing' | 'authorized' | 'rejected' | 'canceled' | 'error';
  provider: string;
  providerDocumentId?: string | null;
  accessKey?: string | null;
  protocol?: string | null;
  authorizedAt?: string | null;
  number?: string | null;
  series?: string | null;
  xmlUrl?: string | null;
  pdfUrl?: string | null;
  responsePayload?: Record<string, unknown>;
  httpStatus?: number | null;
}

const focusProviderAliases = new Set(['focus', 'focus_nfe', 'focusnfe']);
const mockProviderAliases = new Set(['mock', 'mock_fiscal', 'focus_nfe_mock']);

function providerNameFromEnv() {
  return (process.env.FISCAL_PROVIDER || '').trim().toLowerCase();
}

function focusBaseUrlFromEnv() {
  const configuredUrl = (process.env.FOCUS_NFE_BASE_URL || '').trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');
  const env = (process.env.FOCUS_NFE_ENV || 'homologacao').trim().toLowerCase();
  return env === 'production' || env === 'producao'
    ? 'https://api.focusnfe.com.br/v2'
    : 'https://homologacao.focusnfe.com.br/v2';
}

function focusTokenFromEnv() {
  const token = (process.env.FOCUS_NFE_TOKEN || '').trim();
  if (!token) throw fiscalErrors.providerTokenMissing();
  return token;
}

function focusAuthHeader(token: string) {
  return `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
}

function onlyDefined(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

// ATENCAO: mapeamento da NFS-e para a Focus. A CCL emite NFS-e no padrao nacional.
// Os nomes de campo seguem a estrutura documentada da API de NFS-e da Focus (v2),
// mas DEVEM ser validados em homologacao com a doc oficial da conta antes de producao
// (mesmo processo iterativo feito para o CT-e/MDF-e).
export function mapNfseFocusPayload(input: NfseEmitInput) {
  const tomadorDoc = (input.tomador.document || '').replace(/\D/g, '');
  return onlyDefined({
    data_emissao: input.issueDate,
    prestador: onlyDefined({
      cnpj: input.prestador.cnpj,
      inscricao_municipal: input.prestador.municipalRegistration,
      codigo_municipio: input.prestador.cityIbgeCode,
    }),
    tomador: onlyDefined({
      [tomadorDoc.length === 11 ? 'cpf' : 'cnpj']: tomadorDoc || undefined,
      razao_social: input.tomador.name,
      email: input.tomador.email,
      inscricao_municipal: input.tomador.municipalRegistration,
      endereco: onlyDefined({
        logradouro: input.tomador.street,
        numero: input.tomador.number,
        bairro: input.tomador.district,
        codigo_municipio: input.tomador.cityIbgeCode,
        uf: input.tomador.state,
        cep: (input.tomador.zipCode || '').replace(/\D/g, '') || undefined,
      }),
    }),
    servico: onlyDefined({
      aliquota: input.servico.issRate ?? undefined,
      discriminacao: input.servico.description,
      iss_retido: input.servico.issRetained,
      item_lista_servico: input.servico.serviceListItem,
      codigo_tributario_municipio: input.servico.serviceCode,
      codigo_cnae: input.servico.cnaeCode,
      valor_servicos: input.servico.amount,
      codigo_municipio: input.servico.cityIbgeCode || input.prestador.cityIbgeCode,
    }),
  });
}

function mapNfseStatus(status: unknown): NfseProviderResponse['status'] {
  const normalized = String(status || '').toLowerCase();
  if (['autorizado', 'autorizada', 'authorized'].includes(normalized)) return 'authorized';
  if (['cancelado', 'cancelada', 'canceled'].includes(normalized)) return 'canceled';
  if (['rejeitado', 'rejeitada', 'rejected', 'erro', 'error', 'erro_autorizacao'].includes(normalized)) return 'rejected';
  if (['processando_autorizacao', 'processando', 'processing'].includes(normalized)) return 'processing';
  return 'processing';
}

function pickString(payload: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!payload) return null;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function mapNfseResponse(responsePayload: Record<string, unknown>, httpStatus: number, reference: string, provider = 'focus_nfe'): NfseProviderResponse {
  return {
    status: mapNfseStatus(responsePayload.status),
    provider,
    providerDocumentId: pickString(responsePayload, ['ref']) || reference,
    accessKey: pickString(responsePayload, ['chave', 'chave_nfse', 'codigo_verificacao']),
    protocol: pickString(responsePayload, ['protocolo', 'numero_protocolo']),
    authorizedAt: pickString(responsePayload, ['data_emissao', 'autorizado_em', 'data_autorizacao']),
    number: pickString(responsePayload, ['numero', 'numero_nfse']),
    series: pickString(responsePayload, ['serie']),
    xmlUrl: pickString(responsePayload, ['caminho_xml_nota_fiscal', 'caminho_xml', 'url_xml']),
    pdfUrl: pickString(responsePayload, ['caminho_danfse', 'caminho_danfe', 'url', 'url_danfse', 'pdf']),
    responsePayload,
    httpStatus,
  };
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function numericHash(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 1000000000;
  return String(Math.abs(hash)).padStart(9, '0');
}

export interface NfseProviderAdapter {
  name: string;
  emit(input: NfseEmitInput): Promise<NfseProviderResponse>;
  consult(reference: string): Promise<NfseProviderResponse>;
  cancel(reference: string, justification: string): Promise<NfseProviderResponse>;
}

function createFocusNfseAdapter(): NfseProviderAdapter {
  return {
    name: 'focus_nfe',
    async emit(input) {
      const token = focusTokenFromEnv();
      const payload = mapNfseFocusPayload(input);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/nfse?ref=${encodeURIComponent(input.reference)}`, {
          method: 'POST',
          headers: { Authorization: focusAuthHeader(token), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);
        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed('Falha ao emitir NFS-e na Focus NFe.', {
            provider: 'focus_nfe',
            httpStatus: response.status,
            documentKind: 'NFS-e',
            response: responsePayload,
          });
        }
        return mapNfseResponse(responsePayload, response.status, input.reference);
      } finally {
        clearTimeout(timeout);
      }
    },
    async consult(reference) {
      const token = focusTokenFromEnv();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/nfse/${encodeURIComponent(reference)}`, {
          method: 'GET',
          headers: { Authorization: focusAuthHeader(token) },
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);
        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed('Falha ao consultar NFS-e na Focus NFe.', {
            provider: 'focus_nfe',
            httpStatus: response.status,
            documentKind: 'NFS-e',
            response: responsePayload,
          });
        }
        return mapNfseResponse(responsePayload, response.status, reference);
      } finally {
        clearTimeout(timeout);
      }
    },
    async cancel(reference, justification) {
      const token = focusTokenFromEnv();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/nfse/${encodeURIComponent(reference)}`, {
          method: 'DELETE',
          headers: { Authorization: focusAuthHeader(token), 'Content-Type': 'application/json' },
          body: JSON.stringify({ justificativa: justification }),
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);
        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed('Falha ao cancelar NFS-e na Focus NFe.', {
            provider: 'focus_nfe',
            httpStatus: response.status,
            documentKind: 'NFS-e',
            response: responsePayload,
          });
        }
        return mapNfseResponse(responsePayload, response.status, reference);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function createMockNfseAdapter(): NfseProviderAdapter {
  return {
    name: 'mock_fiscal',
    async emit(input) {
      return {
        status: 'processing',
        provider: 'mock_fiscal',
        providerDocumentId: input.reference,
        responsePayload: { ref: input.reference, status: 'processando_autorizacao', mensagem: 'Emissao de NFS-e simulada em ambiente local.' },
        httpStatus: 202,
      };
    },
    async consult(reference) {
      const number = numericHash(reference).slice(0, 6);
      return {
        status: 'authorized',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        accessKey: numericHash(`${reference}:key`),
        protocol: `MOCK${numericHash(`${reference}:prot`)}`,
        authorizedAt: new Date().toISOString(),
        number,
        series: '1',
        xmlUrl: `mock://nfse/${reference}/nfse.xml`,
        pdfUrl: `mock://nfse/${reference}/danfse.pdf`,
        responsePayload: { ref: reference, status: 'autorizado', numero: number, mensagem: 'NFS-e autorizada em mock local.' },
        httpStatus: 200,
      };
    },
    async cancel(reference, justification) {
      return {
        status: 'canceled',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        responsePayload: { ref: reference, status: 'cancelado', justificativa: justification },
        httpStatus: 200,
      };
    },
  };
}

export function getNfseProviderAdapter(): NfseProviderAdapter {
  const providerName = providerNameFromEnv();
  if (!providerName) throw fiscalErrors.providerNotConfigured();
  if (focusProviderAliases.has(providerName)) return createFocusNfseAdapter();
  if (mockProviderAliases.has(providerName)) return createMockNfseAdapter();
  throw fiscalErrors.providerNotConfigured();
}
