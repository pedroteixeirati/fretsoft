import type { FiscalDocumentRow, FiscalPartyRow } from '../dtos/fiscal-document.types';
import { fiscalErrors } from '../errors/fiscal.errors';

export type FiscalProviderOperation = 'emit_document' | 'consult_document';

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
  consultDocument(request: FiscalProviderRequest): Promise<FiscalProviderResponse>;
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

function focusDocumentKind(documentType: FiscalDocumentRow['document_type']) {
  return documentType === 'mdfe' ? 'MDF-e' : documentType === 'cte_os' ? 'CT-e OS' : 'CT-e';
}

function focusReference(document: FiscalDocumentRow) {
  return document.idempotency_key || `${document.document_type}-${document.series}-${document.number}`;
}

function focusAuthHeader(token: string) {
  return `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
}

function onlyDefinedEntries(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function partyByRole(parties: FiscalPartyRow[], role: FiscalPartyRow['role']) {
  return parties.find((party) => party.role === role);
}

function focusPartyFields(prefix: string, party?: FiscalPartyRow) {
  if (!party) return {};
  const digits = (party.document_number || '').replace(/\D/g, '');
  return onlyDefinedEntries({
    [`${digits.length === 11 ? 'cpf' : 'cnpj'}_${prefix}`]: digits || undefined,
    [`inscricao_estadual_${prefix}`]: party.state_registration || undefined,
    [`nome_${prefix}`]: party.name,
    [`municipio_${prefix}`]: party.city || undefined,
    [`uf_${prefix}`]: party.state || undefined,
  });
}

function mapFocusCtePayload(request: FiscalProviderRequest) {
  const document = request.document;
  const taxData = document.tax_data || {};
  const emitter = document.emitter_snapshot || {};
  const sender = partyByRole(request.parties, 'sender');
  const recipient = partyByRole(request.parties, 'recipient');
  const dispatcher = partyByRole(request.parties, 'dispatcher');
  const receiver = partyByRole(request.parties, 'receiver');

  return onlyDefinedEntries({
    ...emitter,
    ...taxData,
    natureza_operacao: document.tax_data?.natureza_operacao || 'PRESTACAO DE SERVICO DE TRANSPORTE',
    data_emissao: document.issue_date,
    tipo_documento: taxData.tipo_documento ?? '0',
    codigo_municipio_envio: document.tax_data?.codigo_municipio_envio,
    municipio_envio: document.tax_data?.municipio_envio || document.origin_name || undefined,
    uf_envio: document.tax_data?.uf_envio,
    modal: taxData.modal || '01',
    tipo_servico: taxData.tipo_servico || '0',
    codigo_municipio_inicio: document.tax_data?.codigo_municipio_inicio,
    municipio_inicio: document.tax_data?.municipio_inicio || document.origin_name || undefined,
    uf_inicio: document.tax_data?.uf_inicio,
    codigo_municipio_fim: document.tax_data?.codigo_municipio_fim,
    municipio_fim: document.tax_data?.municipio_fim || document.destination_name || undefined,
    uf_fim: document.tax_data?.uf_fim,
    tomador: document.tax_data?.tomador,
    retirar_mercadoria: taxData.retirar_mercadoria || '1',
    indicador_inscricao_estadual_tomador: taxData.indicador_inscricao_estadual_tomador || '1',
    valor_total: Number(document.amount || 0),
    valor_receber: Number(document.amount || 0),
    valor_total_carga: taxData.valor_total_carga || Number(document.amount || 0),
    produto_predominante: taxData.produto_predominante,
    quantidades: taxData.quantidades,
    nfes: taxData.nfes,
    modal_rodoviario: taxData.modal_rodoviario,
    observacao: document.notes || taxData.observacao,
    ...focusPartyFields('remetente', sender),
    ...focusPartyFields('destinatario', recipient),
    ...focusPartyFields('expedidor', dispatcher),
    ...focusPartyFields('recebedor', receiver),
  });
}

function mapFocusMdfePayload(request: FiscalProviderRequest) {
  const document = request.document;
  const taxData = document.tax_data || {};
  const emitter = document.emitter_snapshot || {};

  return onlyDefinedEntries({
    ...emitter,
    ...taxData,
    data_emissao: document.issue_date,
    modal: taxData.modal || '1',
    tipo_emitente: taxData.tipo_emitente || '1',
    uf_inicio: taxData.uf_inicio,
    uf_fim: taxData.uf_fim,
    veiculo_tracao: taxData.veiculo_tracao,
    percurso: taxData.percurso,
    municipios_carregamento: taxData.municipios_carregamento,
    municipios_descarregamento: taxData.municipios_descarregamento,
    ctes: taxData.ctes,
    nfes: taxData.nfes,
    observacoes: document.notes || taxData.observacoes,
  });
}

function mapFocusPayload(request: FiscalProviderRequest) {
  return request.document.document_type === 'mdfe'
    ? mapFocusMdfePayload(request)
    : mapFocusCtePayload(request);
}

function mapFocusStatus(status: unknown): FiscalDocumentRow['status'] {
  const normalized = String(status || '').toLowerCase();
  if (['autorizado', 'autorizada', 'authorized'].includes(normalized)) return 'authorized';
  if (['cancelado', 'cancelada', 'canceled'].includes(normalized)) return 'canceled';
  if (['denegado', 'denegada', 'denied'].includes(normalized)) return 'denied';
  if (['rejeitado', 'rejeitada', 'rejected'].includes(normalized)) return 'rejected';
  if (['erro_autorizacao', 'erro', 'error'].includes(normalized)) return 'error';
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

function pickNestedString(payload: Record<string, unknown>, path: string[]) {
  let current: unknown = payload;
  for (const key of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' && current.trim() ? current.trim() : null;
}

function mapFocusResponse(responsePayload: Record<string, unknown>, httpStatus: number, reference: string, provider = 'focus_nfe'): FiscalProviderResponse {
  return {
    status: mapFocusStatus(responsePayload.status || responsePayload.status_sefaz),
    provider,
    providerDocumentId: pickString(responsePayload, ['ref']) || reference,
    accessKey: pickString(responsePayload, ['chave', 'chave_cte', 'chave_mdfe', 'chave_nfe']),
    protocol: pickString(responsePayload, ['protocolo', 'protocolo_autorizacao']) || pickNestedString(responsePayload, ['protocolo', 'protocolo']),
    authorizedAt: pickString(responsePayload, ['data_autorizacao', 'autorizado_em']) || pickNestedString(responsePayload, ['protocolo', 'data_recebimento']),
    xml: pickString(responsePayload, ['caminho_xml', 'xml', 'caminho_xml_cte', 'caminho_xml_mdfe', 'caminho_xml_nota_fiscal']),
    dacteUrl: pickString(responsePayload, ['caminho_dacte', 'caminho_damdfe', 'caminho_danfe', 'pdf']),
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
            documentKind: focusDocumentKind(request.document.document_type),
            response: responsePayload,
          });
        }

        return mapFocusResponse(responsePayload, response.status, reference);
      } finally {
        clearTimeout(timeout);
      }
    },
    async consultDocument(request) {
      const token = focusTokenFromEnv();
      const endpoint = focusDocumentEndpoint(request.document.document_type);
      const reference = request.document.provider_document_id || focusReference(request.document);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/${endpoint}/${encodeURIComponent(reference)}?completa=1`, {
          method: 'GET',
          headers: {
            Authorization: focusAuthHeader(token),
          },
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);

        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed('Falha ao consultar documento na Focus NFe.', {
            provider: 'focus_nfe',
            httpStatus: response.status,
            documentKind: focusDocumentKind(request.document.document_type),
            response: responsePayload,
          });
        }

        return mapFocusResponse(responsePayload, response.status, reference);
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
