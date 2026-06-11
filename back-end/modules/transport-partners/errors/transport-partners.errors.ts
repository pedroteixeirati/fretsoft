import { conflictError, validationError } from '../../../shared/errors/app-error';

export const transportPartnerErrors = {
  invalidName: () => validationError('Informe o nome do transportador.', 'invalid_transport_partner_name', 'name'),
  invalidDocument: () => validationError('Informe um CPF (11) ou CNPJ (14) valido.', 'invalid_transport_partner_document', 'documentNumber'),
  invalidType: () => validationError('Tipo de transportador invalido.', 'invalid_transport_partner_type', 'partnerType'),
  invalidRntrc: () => validationError('Informe um RNTRC valido.', 'invalid_transport_partner_rntrc', 'rntrc'),
  invalidStatus: () => validationError('Status do transportador invalido.', 'invalid_transport_partner_status', 'status'),
  duplicatedDocument: () => conflictError('Ja existe um transportador com este documento.', 'duplicated_transport_partner_document', 'documentNumber'),
};
