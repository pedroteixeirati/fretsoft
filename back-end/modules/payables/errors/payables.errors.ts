import { AppError } from '../../../shared/errors/app-error';

export const payableErrors = {
  invalidSourceType: () => new AppError('Origem da conta a pagar invalida.'),
  invalidSourceId: () => new AppError('A origem informada para a conta a pagar e invalida.'),
  invalidDescription: () => new AppError('Informe uma descricao valida para a conta a pagar.'),
  invalidProviderName: () => new AppError('Informe um fornecedor valido para a conta a pagar.'),
  invalidVehicle: () => new AppError('Selecione um veiculo valido para a conta a pagar.'),
  invalidContract: () => new AppError('Selecione um contrato valido para a conta a pagar.'),
  invalidAmount: () => new AppError('O valor da conta a pagar deve ser maior que zero.'),
  invalidDueDate: () => new AppError('Informe um vencimento valido para a conta a pagar.'),
  invalidStatus: () => new AppError('Status da conta a pagar invalido.'),
  invalidPaidAt: () => new AppError('Informe uma data de pagamento valida para a conta a pagar.'),
  invalidProofUrl: () => new AppError('Informe uma URL valida para o comprovante da conta a pagar.'),
  invalidInvoiceStatus: () => new AppError('Status da nota fiscal invalido.'),
  invalidReferenceMonth: () => new AppError('Informe uma competencia valida no formato AAAA-MM.'),
  invalidImportBatch: () => new AppError('Lote de importacao invalido.'),
  invalidImportRowNumber: () => new AppError('Linha de importacao invalida.'),
  expenseSourceRequiresId: () => new AppError('Contas a pagar originadas de custo operacional exigem o identificador da origem.'),
  vehicleNotFound: () => new AppError('O veiculo informado nao pertence a este tenant.'),
  contractNotFound: () => new AppError('O contrato informado nao pertence a este tenant.'),
};
