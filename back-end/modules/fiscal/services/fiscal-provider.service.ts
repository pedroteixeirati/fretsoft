import type { FiscalDocumentRow, FiscalPartyRow } from '../dtos/fiscal-document.types';
import { fiscalErrors } from '../errors/fiscal.errors';

export type FiscalProviderOperation = 'emit_document';

export interface FiscalProviderRequest {
  operation: FiscalProviderOperation;
  document: FiscalDocumentRow;
  parties: FiscalPartyRow[];
}

export interface FiscalProviderResponse {
  status: FiscalDocumentRow['status'];
  provider: string;
  providerDocumentId?: string | null;
  accessKey?: string | null;
  protocol?: string | null;
  authorizedAt?: string | null;
  xml?: string | null;
  dacteUrl?: string | null;
  responsePayload?: Record<string, unknown>;
  httpStatus?: number | null;
}

export interface FiscalProviderAdapter {
  name: string;
  emitDocument(request: FiscalProviderRequest): Promise<FiscalProviderResponse>;
}

const focusProviderAliases = new Set(['focus', 'focus_nfe', 'focusnfe']);

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

function focusDocumentEndpoint(documentType: FiscalDocumentRow['document_type']) {
  if (documentType === 'mdfe') return 'mdfe';
  if (documentType === 'cte_os') return 'cte_os';
  return 'cte';
}

function focusReference(document: FiscalDocumentRow) {
  return document.idempotency_key || `${document.document_type}-${document.series}-${document.number}`;
}

function focusAuthHeader(token: string) {
  return `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
}

function mapFocusPayload(request: FiscalProviderRequest) {
  const document = request.document;
  return {
    natureza_operacao: document.tax_data?.natureza_operacao || 'PRESTACAO DE SERVICO DE TRANSPORTE',
    data_emissao: document.issue_date,
    tipo_documento: document.tax_data?.tipo_documento ?? 1,
    codigo_municipio_envio: document.tax_data?.codigo_municipio_envio,
    municipio_envio: document.tax_data?.municipio_envio || document.origin_name || undefined,
    uf_envio: document.tax_data?.uf_envio,
    codigo_municipio_inicio: document.tax_data?.codigo_municipio_inicio,
    municipio_inicio: document.tax_data?.municipio_inicio || document.origin_name || undefined,
    uf_inicio: document.tax_data?.uf_inicio,
    codigo_municipio_fim: document.tax_data?.codigo_municipio_fim,
    municipio_fim: document.tax_data?.municipio_fim || document.destination_name || undefined,
    uf_fim: document.tax_data?.uf_fim,
    tomador: document.tax_data?.tomador,
    valor_total: Number(document.amount || 0),
    valor_receber: Number(document.amount || 0),
    emitente: document.emitter_snapshot || {},
    partes: request.parties.map((party) => ({
      papel: party.role,
      nome: party.name,
      documento: party.document_number,
      inscricao_estadual: party.state_registration,
      municipio: party.city,
      uf: party.state,
    })),
    observacoes: document.notes || undefined,
    dados_adicionais: document.tax_data || {},
  };
}

function mapFocusStatus(status: unknown): FiscalDocumentRow['status'] {
  const normalized = String(status || '').toLowerCase();
  if (['autorizado', 'autorizada', 'authorized'].includes(normalized)) return 'authorized';
  if (['cancelado', 'cancelada', 'canceled'].includes(normalized)) return 'canceled';
  if (['denegado', 'denegada', 'denied'].includes(normalized)) return 'denied';
  if (['rejeitado', 'rejeitada', 'rejected'].includes(normalized)) return 'rejected';
  if (['erro_autorizacao', 'erro', 'error'].includes(normalized)) return 'error';
  return 'processing';
}

function pickString(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function createFocusNfeProviderAdapter(): FiscalProviderAdapter {
  return {
    name: 'focus_nfe',
    async emitDocument(request) {
      const token = focusTokenFromEnv();
      const endpoint = focusDocumentEndpoint(request.document.document_type);
      const reference = focusReference(request.document);
      const payload = mapFocusPayload(request);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/${endpoint}?ref=${encodeURIComponent(reference)}`, {
          method: 'POST',
          headers: {
            Authorization: focusAuthHeader(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);

        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed('Falha ao comunicar com a Focus NFe.', {
            provider: 'focus_nfe',
            httpStatus: response.status,
            response: responsePayload,
          });
        }

        return {
          status: mapFocusStatus(responsePayload.status || responsePayload.status_sefaz),
          provider: 'focus_nfe',
          providerDocumentId: reference,
          accessKey: pickString(responsePayload, ['chave_nfe', 'chave_cte', 'chave_mdfe', 'chave']),
          protocol: pickString(responsePayload, ['protocolo', 'protocolo_autorizacao']),
          authorizedAt: pickString(responsePayload, ['data_autorizacao', 'autorizado_em']),
          xml: pickString(responsePayload, ['xml', 'caminho_xml_nota_fiscal', 'caminho_xml_cte', 'caminho_xml_mdfe']),
          dacteUrl: pickString(responsePayload, ['caminho_danfe', 'caminho_dacte', 'caminho_damdfe', 'pdf']),
          responsePayload,
          httpStatus: response.status,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export function buildFiscalProviderRequest(document: FiscalDocumentRow, parties: FiscalPartyRow[]): FiscalProviderRequest {
  return {
    operation: 'emit_document',
    document,
    parties,
  };
}

export function serializeFiscalProviderRequest(request: FiscalProviderRequest) {
  return {
    operation: request.operation,
    document: {
      id: request.document.id,
      documentType: request.document.document_type,
      model: request.document.model,
      series: request.document.series,
      number: request.document.number,
      issueDate: request.document.issue_date,
      dueDate: request.document.due_date,
      amount: Number(request.document.amount || 0),
      originName: request.document.origin_name,
      destinationName: request.document.destination_name,
      takerName: request.document.taker_name,
      taxData: request.document.tax_data || {},
      emitterSnapshot: request.document.emitter_snapshot || {},
    },
    parties: request.parties.map((party) => ({
      role: party.role,
      name: party.name,
      documentNumber: party.document_number,
      stateRegistration: party.state_registration,
      city: party.city,
      state: party.state,
    })),
  };
}

export function getFiscalProviderAdapter(): FiscalProviderAdapter {
  const providerName = providerNameFromEnv();
  if (!providerName) {
    throw fiscalErrors.providerNotConfigured();
  }

  if (focusProviderAliases.has(providerName)) {
    return createFocusNfeProviderAdapter();
  }

  throw fiscalErrors.providerNotConfigured();
}
