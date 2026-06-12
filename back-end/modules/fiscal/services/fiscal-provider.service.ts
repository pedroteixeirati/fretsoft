import type { FiscalDocumentRow, FiscalPartyRow, FiscalPaymentRow } from '../dtos/fiscal-document.types';
import { fiscalErrors } from '../errors/fiscal.errors';
import { findDefaultCargoInsurancePolicy } from '../../cargo-insurance-policies/repositories/cargo-insurance-policies.repository';

export type FiscalProviderOperation = 'emit_document' | 'consult_document' | 'close_document' | 'cancel_document' | 'correction_letter' | 'add_mdfe_driver' | 'provider_webhook' | 'send_email';

export interface FiscalCorrectionLetterInput {
  correctedField: string;
  correctedValue: string;
  correctedGroup?: string;
  correctedGroupItemNumber?: string;
}

export interface FiscalMdfeDriverInput {
  name: string;
  cpf: string;
}

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

function buildMdfePayments(payments: FiscalPaymentRow[]) {
  if (!payments || payments.length === 0) return undefined;
  return payments.map((payment) => {
    const documentNumber = (payment.payee_document || '').replace(/\D/g, '');
    const amount = Number(payment.amount || 0);
    return onlyDefinedEntries({
      nome: payment.payee_name || undefined,
      cpf: documentNumber.length === 11 ? documentNumber : undefined,
      cnpj: documentNumber.length === 14 ? documentNumber : undefined,
      componentes: [onlyDefinedEntries({ tipo: payment.component_type, valor: amount })],
      valor_total_contrato: amount,
      forma_pagamento: '0',
      pix: payment.pix_key || undefined,
    });
  });
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
  cancelDocument(request: FiscalProviderRequest, justification: string): Promise<FiscalProviderResponse>;
  sendCorrectionLetter(request: FiscalProviderRequest, correction: FiscalCorrectionLetterInput): Promise<FiscalProviderResponse>;
  addMdfeDriver(request: FiscalProviderRequest, driver: FiscalMdfeDriverInput): Promise<FiscalProviderResponse>;
  sendEmail(request: FiscalProviderRequest, emails: string[]): Promise<FiscalProviderResponse>;
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

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function mapMdfeMunicipiosCarregamento(taxData: Record<string, unknown>) {
  const municipios = Array.isArray(taxData.municipios_carregamento) ? taxData.municipios_carregamento as unknown[] : [];
  return municipios.map((municipio) => {
    const item = asObject(municipio);
    return onlyDefinedEntries({
      codigo: item.codigo || item.codigo_municipio,
      nome: item.nome || item.nome_municipio,
    });
  }).filter((municipio) => Object.keys(municipio).length > 0);
}

function mapMdfeMunicipiosDescarregamento(taxData: Record<string, unknown>, ctes: Array<Record<string, unknown>>) {
  const municipios = Array.isArray(taxData.municipios_descarregamento) ? taxData.municipios_descarregamento as unknown[] : [];
  return municipios.map((municipio) => {
    const item = asObject(municipio);
    const conhecimentos = Array.isArray(item.conhecimentos_transporte)
      ? item.conhecimentos_transporte
      : Array.isArray(item.ctes)
        ? item.ctes
        : ctes;
    return onlyDefinedEntries({
      codigo: item.codigo || item.codigo_municipio,
      nome: item.nome || item.nome_municipio,
      conhecimentos_transporte: conhecimentos,
    });
  }).filter((municipio) => Object.keys(municipio).length > 0);
}

function mapMdfeCargoInsurance(policy: Awaited<ReturnType<typeof findDefaultCargoInsurancePolicy>> | null) {
  if (!policy) return undefined;
  return [onlyDefinedEntries({
    responsavel_seguro: policy.responsible_type === 'carrier' ? '1' : '2',
    nome_seguradora: policy.insurance_company_name,
    cnpj_seguradora: policy.insurance_company_document,
    numero_apolice: policy.policy_number,
    numero_averbacao: Array.isArray(policy.endorsement_numbers) ? policy.endorsement_numbers : [],
  })];
}

function mapMdfeContractors(mdfe: Record<string, unknown>, taxData: Record<string, unknown>, document: FiscalDocumentRow) {
  if (Array.isArray(asObject(taxData.modal_rodoviario).contratantes)) {
    return asObject(taxData.modal_rodoviario).contratantes;
  }
  if (Array.isArray(taxData.contratantes)) {
    return taxData.contratantes;
  }

  const documentNumber = String(mdfe.contratanteDocumento || taxData.contratante_documento || '').replace(/\D/g, '');
  const name = mdfe.contratanteNome || taxData.contratante_nome || document.taker_name;
  if (!documentNumber && !name) return undefined;

  return [onlyDefinedEntries({
    nome: name,
    cpf: documentNumber.length === 11 ? documentNumber : undefined,
    cnpj: documentNumber.length === 14 ? documentNumber : undefined,
  })];
}

function countMdfeCtes(ctes: unknown) {
  return Array.isArray(ctes) ? ctes.length : undefined;
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

function mapFocusMdfePayload(request: FiscalProviderRequest, cargoInsurancePolicy: Awaited<ReturnType<typeof findDefaultCargoInsurancePolicy>> | null = null) {
  const document = request.document;
  const taxData = document.tax_data || {};
  const mdfe = (document.mdfe_data || {}) as Record<string, unknown>;
  const emitter = document.emitter_snapshot || {};
  const ctes = Array.isArray(mdfe.cteKeys) && (mdfe.cteKeys as unknown[]).length
    ? (mdfe.cteKeys as unknown[]).map((chave) => ({ chave_cte: String(chave) }))
    : taxData.ctes;
  const modalRodoviario = {
    ...asObject(taxData.modal_rodoviario),
    registro_nacional_transporte: document.rntrc || taxData.rntrc || asObject(taxData.modal_rodoviario).rntrc || asObject(taxData.modal_rodoviario).registro_nacional_transporte,
    placa_veiculo: mdfe.vehiclePlate || taxData.placa_veiculo,
    renavam_veiculo: mdfe.vehicleRenavam || taxData.renavam_veiculo,
    uf_licenciamento_veiculo: mdfe.vehicleUf || taxData.uf_licenciamento_veiculo,
    tara_veiculo: mdfe.vehicleTara ?? taxData.tara_veiculo,
    tipo_rodado_veiculo: taxData.tipo_rodado_veiculo || '06',
    tipo_carroceria_veiculo: taxData.tipo_carroceria_veiculo || '00',
    contratantes: mapMdfeContractors(mdfe, taxData, document),
    pagamentos: buildMdfePayments(request.payments) || asObject(taxData.modal_rodoviario).pagamentos || taxData.pagamentos,
    condutores: mdfe.condutorNome
      ? [onlyDefinedEntries({ nome: mdfe.condutorNome, cpf: mdfe.condutorCpf })]
      : taxData.condutores,
  };

  return onlyDefinedEntries({
    ...emitter,
    data_emissao: document.issue_date,
    emitente: taxData.emitente || taxData.tipo_emitente || '1',
    uf_inicio: mdfe.ufInicio || taxData.uf_inicio,
    uf_fim: mdfe.ufFim || taxData.uf_fim,
    percurso: mdfe.percurso || taxData.percurso,
    municipios_carregamento: mapMdfeMunicipiosCarregamento(taxData),
    municipios_descarregamento: mapMdfeMunicipiosDescarregamento(taxData, Array.isArray(ctes) ? ctes as Array<Record<string, unknown>> : []),
    nfes: taxData.nfes,
    quantidade_total_cte: taxData.quantidade_total_cte || countMdfeCtes(ctes),
    valor_total_carga: mdfe.valorTotal ?? taxData.valor_total_carga ?? taxData.valor_total,
    codigo_unidade_medida_peso_bruto: taxData.codigo_unidade_medida_peso_bruto || '01',
    peso_bruto: mdfe.pesoTotal ?? taxData.peso_bruto ?? taxData.peso_bruto_total,
    tipo_carga: taxData.tipo_carga || '05',
    descricao_produto: mdfe.produtoPredominante || taxData.descricao_produto || taxData.produto_predominante,
    codigo_ncm_produto: mdfe.produtoNcm || taxData.codigo_ncm_produto,
    cep_carregamento: mdfe.cepCarregamento || taxData.cep_carregamento,
    latitude_carregamento: taxData.latitude_carregamento,
    longitude_carregamento: taxData.longitude_carregamento,
    cep_descarregamento: mdfe.cepDescarregamento || taxData.cep_descarregamento,
    latitude_descarregamento: taxData.latitude_descarregamento,
    longitude_descarregamento: taxData.longitude_descarregamento,
    seguros_carga: taxData.seguros_carga || mapMdfeCargoInsurance(cargoInsurancePolicy),
    ciot: document.ciot || taxData.ciot || undefined,
    infPag: buildInfPag(request.payments) || taxData.infPag,
    observacoes: document.notes || taxData.observacoes,
    modal_rodoviario: onlyDefinedEntries(modalRodoviario),
  });
}

async function mapFocusPayload(request: FiscalProviderRequest) {
  return request.document.document_type === 'mdfe'
    ? mapFocusMdfePayload(request, await findDefaultCargoInsurancePolicy(request.document.tenant_id))
    : mapFocusCtePayload(request);
}

function mapFocusStatus(status: unknown): FiscalDocumentRow['status'] {
  const normalized = String(status || '').toLowerCase();
  if (['autorizado', 'autorizada', 'authorized'].includes(normalized)) return 'authorized';
  if (['cancelado', 'cancelada', 'canceled'].includes(normalized)) return 'canceled';
  if (['denegado', 'denegada', 'denied'].includes(normalized)) return 'denied';
  if (['rejeitado', 'rejeitada', 'rejected'].includes(normalized)) return 'rejected';
  if (['erro_autorizacao', 'erro_cancelamento', 'erro', 'error'].includes(normalized)) return 'error';
  if (['encerrado', 'encerrada'].includes(normalized)) return 'authorized';
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

export function mapFocusResponse(responsePayload: Record<string, unknown>, httpStatus: number, reference: string, provider = 'focus_nfe'): FiscalProviderResponse {
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
      const payload = await mapFocusPayload(request);
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
        const response = await fetch(`${focusBaseUrlFromEnv()}/mdfe/${encodeURIComponent(reference)}/encerrar`, {
          method: 'POST',
          headers: {
            Authorization: focusAuthHeader(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(onlyDefinedEntries({
            data: new Date().toISOString().slice(0, 10),
            sigla_uf: mdfe.ufFim,
            nome_municipio: mdfe.nomeMunicipioEncerramento || request.document.destination_name,
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
    async cancelDocument(request, justification) {
      const token = focusTokenFromEnv();
      const endpoint = focusDocumentEndpoint(request.document.document_type);
      const reference = request.document.provider_document_id || focusReference(request.document);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/${endpoint}/${encodeURIComponent(reference)}`, {
          method: 'DELETE',
          headers: {
            Authorization: focusAuthHeader(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ justificativa: justification }),
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);

        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed(`Falha ao cancelar o ${focusDocumentKind(request.document.document_type)} na Focus NFe.`, {
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
    async sendCorrectionLetter(request, correction) {
      const token = focusTokenFromEnv();
      const endpoint = focusDocumentEndpoint(request.document.document_type);
      const reference = request.document.provider_document_id || focusReference(request.document);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const payload = onlyDefinedEntries({
        grupo_corrigido: correction.correctedGroup,
        campo_corrigido: correction.correctedField,
        valor_corrigido: correction.correctedValue,
        numero_item_grupo_corrigido: correction.correctedGroupItemNumber,
        campo_api: '1',
      });

      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/${endpoint}/${encodeURIComponent(reference)}/carta_correcao`, {
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
          throw fiscalErrors.providerRequestFailed(`Falha ao emitir carta de correcao do ${focusDocumentKind(request.document.document_type)} na Focus NFe.`, {
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
    async addMdfeDriver(request, driver) {
      const token = focusTokenFromEnv();
      const reference = request.document.provider_document_id || focusReference(request.document);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${focusBaseUrlFromEnv()}/mdfe/${encodeURIComponent(reference)}/inclusao_condutor`, {
          method: 'POST',
          headers: {
            Authorization: focusAuthHeader(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nome: driver.name, cpf: driver.cpf }),
          signal: controller.signal,
        });
        const responsePayload = await readJsonResponse(response);

        if (!response.ok) {
          throw fiscalErrors.providerRequestFailed('Falha ao incluir condutor no MDF-e na Focus NFe.', {
            provider: 'focus_nfe',
            httpStatus: response.status,
            documentKind: 'MDF-e',
            response: responsePayload,
          });
        }

        return mapFocusResponse(responsePayload, response.status, reference);
      } finally {
        clearTimeout(timeout);
      }
    },
    async sendEmail(request, emails) {
      const reference = request.document.provider_document_id || focusReference(request.document);
      throw fiscalErrors.providerOperationUnsupported('A Focus NFe nao disponibiliza reenvio por e-mail para CT-e/MDF-e nesta API. Use os links de XML/DACTE retornados na consulta.', {
        provider: 'focus_nfe',
        documentKind: focusDocumentKind(request.document.document_type),
        providerDocumentId: reference,
        emails,
      });
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
    async cancelDocument(request, justification) {
      const reference = request.document.provider_document_id || focusReference(request.document);
      return {
        status: 'canceled',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        responsePayload: {
          ref: reference,
          status: 'cancelado',
          justificativa: justification,
          mensagem: 'Documento fiscal cancelado em mock local.',
        },
        httpStatus: 200,
      };
    },
    async sendCorrectionLetter(request, correction) {
      const reference = request.document.provider_document_id || focusReference(request.document);
      return {
        status: 'authorized',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        responsePayload: {
          ref: reference,
          status: 'autorizado',
          status_sefaz: '135',
          mensagem_sefaz: 'Evento registrado e vinculado a CT-e',
          numero_carta_correcao: 1,
          correcao: correction,
        },
        httpStatus: 200,
      };
    },
    async addMdfeDriver(request, driver) {
      const reference = request.document.provider_document_id || focusReference(request.document);
      return {
        status: 'authorized',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        responsePayload: {
          ref: reference,
          status: 'incluido',
          status_sefaz: '135',
          mensagem_sefaz: 'Evento registrado e vinculado a MDF-e',
          condutor: driver,
        },
        httpStatus: 200,
      };
    },
    async sendEmail(request, emails) {
      const reference = request.document.provider_document_id || focusReference(request.document);
      return {
        status: 'authorized',
        provider: 'mock_fiscal',
        providerDocumentId: reference,
        responsePayload: { ref: reference, enviado: true, emails, mensagem: 'Documento reenviado por e-mail em mock local.' },
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
