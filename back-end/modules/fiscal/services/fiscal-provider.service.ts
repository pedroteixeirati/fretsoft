import type { FiscalDocumentRow, FiscalPartyRow, FiscalPaymentRow } from '../dtos/fiscal-document.types';
import { fiscalErrors } from '../errors/fiscal.errors';

export type FiscalProviderOperation = 'emit_document' | 'consult_document' | 'close_document';

export interface FiscalProviderRequest {
  operation: FiscalProviderOperation;
  document: FiscalDocumentRow;
  parties: FiscalPartyRow[];
  payments: FiscalPaymentRow[];
}

function buildInfPag(payments: FiscalPaymentRow[]) {
  if (!payments || payments.length === 0) return undefined;
  return payments.map((payment) => onlyDefinedEntries({
    nome: payment.payee_name || undefined,
    cpf_cnpj: payment.payee_document || undefined,
    valor: Number(payment.amount || 0),
    componentes: [onlyDefinedEntries({ tipo_componente: payment.component_type, valor_componente: Number(payment.amount || 0) })],
    banco: payment.bank_name || undefined,
    agencia: payment.bank_branch || undefined,
    conta: payment.bank_account || undefined,
    pix: payment.pix_key || undefined,
  }));
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
  closeDocument(request: FiscalProviderRequest): Promise<FiscalProviderResponse>;
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

function numericHash(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000000000;
  }
  return String(Math.abs(hash)).padStart(9, '0');
}

function mockAccessKey(document: FiscalDocumentRow) {
  const seed = `${document.document_type}${document.series}${document.number}${document.id}`;
  return `${numericHash(seed)}${numericHash(seed.split('').reverse().join(''))}${numericHash(`${seed}:cte`)}${numericHash(`${seed}:mdfe`)}${numericHash(`${seed}:focus`).slice(0, 8)}`.slice(0, 44);
}

function mockProtocol(document: FiscalDocumentRow) {
  return `MOCK${numericHash(`${document.id}:${document.series}:${document.number}`)}`;
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
  // Preserva letras: o CNPJ alfanumerico (2026) nao pode ter caracteres removidos.
  const document = (party.document_number || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const isCpf = document.length === 11 && /^\d{11}$/.test(document);
  return onlyDefinedEntries({
    [`${isCpf ? 'cpf' : 'cnpj'}_${prefix}`]: document || undefined,
    [`inscricao_estadual_${prefix}`]: party.state_registration || undefined,
    [`nome_${prefix}`]: party.name,
    [`telefone_${prefix}`]: party.phone || undefined,
    [`logradouro_${prefix}`]: party.street || undefined,
    [`numero_${prefix}`]: party.number || undefined,
    [`bairro_${prefix}`]: party.district || undefined,
    [`cep_${prefix}`]: (party.zip_code || '').replace(/\D/g, '') || undefined,
    [`codigo_municipio_${prefix}`]: party.city_ibge_code || undefined,
    [`municipio_${prefix}`]: party.city || undefined,
    [`uf_${prefix}`]: party.state || undefined,
  });
}

function cteNfes(cteData: Record<string, unknown>, taxData: Record<string, unknown>) {
  const keys = Array.isArray(cteData.nfeKeys) ? (cteData.nfeKeys as unknown[]) : null;
  if (keys && keys.length) return keys.map((key) => ({ chave_nfe: String(key) }));
  return taxData.nfes;
}

function mapFocusCtePayload(request: FiscalProviderRequest) {
  const document = request.document;
  const taxData = document.tax_data || {};
  const cteData = (document.cte_data || {}) as Record<string, unknown>;
  const emitter = document.emitter_snapshot || {};
  const sender = partyByRole(request.parties, 'sender');
  const recipient = partyByRole(request.parties, 'recipient');
  const dispatcher = partyByRole(request.parties, 'dispatcher');
  const receiver = partyByRole(request.parties, 'receiver');
  const taker = partyByRole(request.parties, 'taker');

  const tomadorCodes: Record<string, string> = { remetente: '0', expedidor: '1', recebedor: '2', destinatario: '3', outros: '4' };
  const tomadorCode = tomadorCodes[String(cteData.tomadorTipo || '')];

  return onlyDefinedEntries({
    ...emitter,
    ...taxData,
    natureza_operacao: cteData.naturezaOperacao || document.tax_data?.natureza_operacao || 'PRESTACAO DE SERVICO DE TRANSPORTE',
    data_emissao: document.issue_date,
    tipo_documento: taxData.tipo_documento ?? '0',
    cfop: cteData.cfop || taxData.cfop || undefined,
    codigo_municipio_envio: cteData.municipioInicioIbge || document.tax_data?.codigo_municipio_envio,
    municipio_envio: document.tax_data?.municipio_envio || document.origin_name || undefined,
    uf_envio: document.tax_data?.uf_envio,
    modal: taxData.modal || '01',
    tipo_servico: cteData.tipoServico || taxData.tipo_servico || '0',
    codigo_municipio_inicio: cteData.municipioInicioIbge || document.tax_data?.codigo_municipio_inicio,
    municipio_inicio: document.tax_data?.municipio_inicio || document.origin_name || undefined,
    uf_inicio: document.tax_data?.uf_inicio,
    codigo_municipio_fim: cteData.municipioFimIbge || document.tax_data?.codigo_municipio_fim,
    municipio_fim: document.tax_data?.municipio_fim || document.destination_name || undefined,
    uf_fim: document.tax_data?.uf_fim,
    tomador: tomadorCode ?? document.tax_data?.tomador,
    retirar_mercadoria: taxData.retirar_mercadoria || '1',
    indicador_inscricao_estadual_tomador: taxData.indicador_inscricao_estadual_tomador || '1',
    valor_total: Number(document.amount || 0),
    valor_receber: Number(document.amount || 0),
    valor_total_carga: cteData.valorCarga || taxData.valor_total_carga || Number(document.amount || 0),
    icms_situacao_tributaria: cteData.icmsCst || taxData.icms_situacao_tributaria || undefined,
    icms_base_calculo: cteData.icmsBaseCalculo ?? taxData.icms_base_calculo,
    icms_aliquota: cteData.icmsAliquota ?? taxData.icms_aliquota,
    icms_valor: cteData.icmsValor ?? taxData.icms_valor,
    produto_predominante: cteData.produtoPredominante || taxData.produto_predominante,
    quantidades: taxData.quantidades,
    nfes: cteNfes(cteData, taxData),
    modal_rodoviario: taxData.modal_rodoviario,
    observacao: document.notes || taxData.observacao,
    ciot: document.ciot || taxData.ciot || undefined,
    rntrc: document.rntrc || taxData.rntrc || undefined,
    infPag: buildInfPag(request.payments) || taxData.infPag,
    ...focusPartyFields('remetente', sender),
    ...focusPartyFields('destinatario', recipient),
    ...focusPartyFields('expedidor', dispatcher),
    ...focusPartyFields('recebedor', receiver),
    ...(tomadorCode === '4' ? focusPartyFields('tomador', taker) : {}),
  });
}

function mapFocusMdfePayload(request: FiscalProviderRequest) {
  const document = request.document;
  const taxData = document.tax_data || {};
  const mdfe = (document.mdfe_data || {}) as Record<string, unknown>;
  const emitter = document.emitter_snapshot || {};

  const veiculoTracao = (mdfe.vehiclePlate || mdfe.vehicleRenavam)
    ? onlyDefinedEntries({
        placa: mdfe.vehiclePlate,
        RENAVAM: mdfe.vehicleRenavam,
        uf: mdfe.vehicleUf,
        tara: mdfe.vehicleTara,
        condutores: mdfe.condutorNome ? [onlyDefinedEntries({ nome: mdfe.condutorNome, cpf: mdfe.condutorCpf })] : undefined,
      })
    : taxData.veiculo_tracao;
  const ctes = Array.isArray(mdfe.cteKeys) && (mdfe.cteKeys as unknown[]).length
    ? (mdfe.cteKeys as unknown[]).map((chave) => ({ chave_cte: String(chave) }))
    : taxData.ctes;

  return onlyDefinedEntries({
    ...emitter,
    ...taxData,
    data_emissao: document.issue_date,
    modal: taxData.modal || '1',
    tipo_emitente: taxData.tipo_emitente || '1',
    uf_inicio: mdfe.ufInicio || taxData.uf_inicio,
    uf_fim: mdfe.ufFim || taxData.uf_fim,
    veiculo_tracao: veiculoTracao,
    percurso: mdfe.percurso || taxData.percurso,
    municipios_carregamento: taxData.municipios_carregamento,
    municipios_descarregamento: taxData.municipios_descarregamento,
    ctes,
    nfes: taxData.nfes,
    valor_total: mdfe.valorTotal ?? taxData.valor_total,
    peso_bruto_total: mdfe.pesoTotal ?? taxData.peso_bruto_total,
    produto_predominante: mdfe.produtoPredominante || taxData.produto_predominante,
    ciot: document.ciot || taxData.ciot || undefined,
    rntrc: document.rntrc || taxData.rntrc || undefined,
    infPag: buildInfPag(request.payments) || taxData.infPag,
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
    async closeDocument(request) {
      const token = focusTokenFromEnv();
      const reference = request.document.provider_document_id || focusReference(request.document);
      const mdfe = request.document.mdfe_data || {};
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/mdfe/${encodeURIComponent(reference)}/encerramento`, {
          method: 'POST',
          headers: {
            Authorization: focusAuthHeader(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(onlyDefinedEntries({
            data_encerramento: new Date().toISOString().slice(0, 10),
            uf: mdfe.ufFim,
            codigo_municipio: mdfe.municipioFimIbge,
          })),
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);

        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed('Falha ao encerrar o MDF-e na Focus NFe.', {
            provider: 'focus_nfe',
            httpStatus: response.status,
            response: responsePayload,
          });
        }

        return { status: 'authorized', provider: 'focus_nfe', responsePayload, httpStatus: response.status };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export function createMockFiscalProviderAdapter(): FiscalProviderAdapter {
  return {
    name: 'mock_fiscal',
    async emitDocument(request) {
      const reference = focusReference(request.document);
      return {
        status: 'processing',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        responsePayload: {
          ref: reference,
          status: 'processando_autorizacao',
          mensagem: 'Emissao fiscal simulada em ambiente local.',
        },
        httpStatus: 202,
      };
    },
    async consultDocument(request) {
      const reference = request.document.provider_document_id || focusReference(request.document);
      const accessKey = mockAccessKey(request.document);
      const protocol = mockProtocol(request.document);
      const suffix = request.document.document_type === 'mdfe' ? 'mdfe' : 'cte';

      return {
        status: 'authorized',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        accessKey,
        protocol,
        authorizedAt: new Date().toISOString(),
        xml: `mock://fiscal/${reference}/${suffix}.xml`,
        dacteUrl: `mock://fiscal/${reference}/${request.document.document_type === 'mdfe' ? 'damdfe' : 'dacte'}.pdf`,
        responsePayload: {
          ref: reference,
          status: 'autorizado',
          status_sefaz: '100',
          mensagem_sefaz: `Autorizado o uso do ${focusDocumentKind(request.document.document_type)} em mock local`,
          chave: accessKey,
          protocolo: protocol,
          caminho_xml: `mock://fiscal/${reference}/${suffix}.xml`,
          caminho_dacte: request.document.document_type === 'mdfe' ? undefined : `mock://fiscal/${reference}/dacte.pdf`,
          caminho_damdfe: request.document.document_type === 'mdfe' ? `mock://fiscal/${reference}/damdfe.pdf` : undefined,
        },
        httpStatus: 200,
      };
    },
    async closeDocument(request) {
      const reference = request.document.provider_document_id || focusReference(request.document);
      return {
        status: 'authorized',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        responsePayload: {
          ref: reference,
          status: 'encerrado',
          mensagem: 'MDF-e encerrado em mock local.',
        },
        httpStatus: 200,
      };
    },
  };
}

export function buildFiscalProviderRequest(document: FiscalDocumentRow, parties: FiscalPartyRow[], payments: FiscalPaymentRow[] = []): FiscalProviderRequest {
  return {
    operation: 'emit_document',
    document,
    parties,
    payments,
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
      executionMode: request.document.execution_mode,
      ciot: request.document.ciot,
      rntrc: request.document.rntrc,
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
    payments: request.payments.map((payment) => ({
      payeeName: payment.payee_name,
      payeeDocument: payment.payee_document,
      componentType: payment.component_type,
      amount: Number(payment.amount || 0),
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

  if (mockProviderAliases.has(providerName)) {
    return createMockFiscalProviderAdapter();
  }

  throw fiscalErrors.providerNotConfigured();
}
