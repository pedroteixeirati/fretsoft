import { AppError } from '../../../shared/errors/app-error';

export const expenseErrors = {
  invalidDate: () => new AppError('Informe uma data valida para a despesa.', { code: 'invalid_expense_date', field: 'date' }),
  invalidTime: () => new AppError('Informe um horario valido para a despesa.', { code: 'invalid_expense_time', field: 'time' }),
  invalidVehicle: () => new AppError('Selecione um veiculo valido para a despesa.', { code: 'invalid_expense_vehicle', field: 'vehicleId' }),
  invalidProvider: () => new AppError('Informe um fornecedor valido para a despesa.', { code: 'invalid_expense_provider', field: 'provider' }),
  invalidCategory: () => new AppError('Informe uma categoria valida para a despesa.', { code: 'invalid_expense_category', field: 'category' }),
  invalidAmount: () => new AppError('O valor da despesa deve ser maior que zero.', { code: 'invalid_expense_amount', field: 'amount' }),
  invalidQuantity: () => new AppError('A quantidade da despesa deve ser um numero valido.', { code: 'invalid_expense_quantity', field: 'quantity' }),
  invalidOdometer: () => new AppError('O odometro da despesa deve ser um numero valido.', { code: 'invalid_expense_odometer', field: 'odometer' }),
  invalidStatus: () => new AppError('Status da despesa invalido.', { code: 'invalid_expense_status', field: 'status' }),
  invalidFinancialStatus: () => new AppError('Status financeiro do custo operacional invalido.', { code: 'invalid_expense_financial_status', field: 'financialStatus' }),
  invalidDueDate: () => new AppError('Informe um vencimento valido para o custo operacional.', { code: 'invalid_expense_due_date', field: 'dueDate' }),
  invalidPaidAt: () => new AppError('Informe uma data de pagamento valida para o custo operacional.', { code: 'invalid_expense_paid_at', field: 'paidAt' }),
  invalidLinkedPayable: () => new AppError('O vinculo financeiro informado para o custo operacional e invalido.', { code: 'invalid_expense_linked_payable', field: 'linkedPayableId' }),
  invalidContract: () => new AppError('O contrato informado para o custo operacional e invalido.', { code: 'invalid_expense_contract', field: 'contractId' }),
  invalidFreight: () => new AppError('O frete informado para o custo operacional e invalido.', { code: 'invalid_expense_freight', field: 'freightId' }),
  invalidReceiptUrl: () => new AppError('Informe uma URL valida para o comprovante do custo operacional.', { code: 'invalid_expense_receipt_url', field: 'receiptUrl' }),
  vehicleNotFound: () => new AppError('O veiculo informado nao pertence a este tenant.', { code: 'expense_vehicle_not_found', field: 'vehicleId' }),
};
