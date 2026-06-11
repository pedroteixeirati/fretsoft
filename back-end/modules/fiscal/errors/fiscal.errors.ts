import { conflictError, validationError } from '../../../shared/errors/app-error';

export const fiscalErrors = {
  invalidDocumentType: () => validationError('Tipo de documento fiscal invalido.', 'invalid_fiscal_document_type', 'documentType'),
  invalidModel: () => validationError('Modelo fiscal invalido.', 'invalid_fiscal_model', 'model'),
  invalidSeries: () => validationError('Informe uma serie valida.', 'invalid_fiscal_series', 'series'),
  invalidNumber: () => validationError('Informe um numero fiscal valido.', 'invalid_fiscal_number', 'number'),
  invalidAccessKey: () => validationError('A chave de acesso deve conter 44 digitos.', 'invalid_fiscal_access_key', 'accessKey'),
  invalidStatus: () => validationError('Status fiscal invalido.', 'invalid_fiscal_status', 'status'),
  invalidIssueDate: () => validationError('Informe uma data de emissao valida.', 'invalid_fiscal_issue_date', 'issueDate'),
  invalidDueDate: () => validationError('Informe uma data de vencimento valida.', 'invalid_fiscal_due_date', 'dueDate'),
  invalidAmount: () => validationError('Informe um valor fiscal maior que zero.', 'invalid_fiscal_amount', 'amount'),
  invalidAuthorizedAt: () => validationError('Informe uma data de autorizacao valida.', 'invalid_fiscal_authorized_at', 'authorizedAt'),
  invalidPartyRole: () => validationError('Papel da parte fiscal invalido.', 'invalid_fiscal_party_role', 'parties'),
  invalidPartyName: () => validationError('Informe o nome da parte fiscal.', 'invalid_fiscal_party_name', 'parties'),
  invalidPartyState: () => validationError('UF da parte fiscal invalida.', 'invalid_fiscal_party_state', 'parties'),
  duplicatedDocument: () => conflictError('Ja existe um documento fiscal com este tipo, serie e numero.', 'duplicated_fiscal_document', 'number'),
  duplicatedAccessKey: () => conflictError('Ja existe um documento fiscal com esta chave de acesso.', 'duplicated_fiscal_access_key', 'accessKey'),
};
