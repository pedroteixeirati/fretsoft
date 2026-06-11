import { conflictError, validationError } from '../../../shared/errors/app-error';

export const transportPartnerErrors = {
  invalidName: () => validationError('Informe o nome do transportador.', 'invalid_transport_partner_name', 'name'),
  invalidDocument: () => validationError('Informe um CPF (11) ou CNPJ (14) valido.', 'invalid_transport_partner_document', 'documentNumber'),
  invalidType: () => validationError('Tipo de transportador invalido.', 'invalid_transport_partner_type', 'partnerType'),
  invalidRntrc: () => validationError('Informe um RNTRC valido.', 'invalid_transport_partner_rntrc', 'rntrc'),
  invalidPhone: () => validationError('Informe um telefone/WhatsApp valido com DDD.', 'invalid_transport_partner_phone', 'phone'),
  invalidReceiptMethod: () => validationError('Selecione a forma de recebimento.', 'invalid_transport_partner_receipt_method', 'receiptMethod'),
  missingPixData: () => validationError('Informe o tipo de chave PIX e a chave PIX.', 'missing_transport_partner_pix_data', 'pixKey'),
  missingBankData: () => validationError('Informe banco, agencia, conta e tipo de conta.', 'missing_transport_partner_bank_data', 'bankAccount'),
  termsNotAccepted: () => validationError('Aceite os termos de responsabilidade e LGPD para enviar o cadastro.', 'transport_partner_terms_not_accepted'),
  invalidStatus: () => validationError('Status do transportador invalido.', 'invalid_transport_partner_status', 'status'),
  duplicatedDocument: () => conflictError('Ja existe um transportador com este documento.', 'duplicated_transport_partner_document', 'documentNumber'),
};
