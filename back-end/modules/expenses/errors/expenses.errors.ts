import { AppError } from '../../../shared/errors/app-error';

export const expenseErrors = {
  invalidDate: () => new AppError('Informe uma data valida para a despesa.'),
  invalidTime: () => new AppError('Informe um horario valido para a despesa.'),
  invalidVehicle: () => new AppError('Selecione um veiculo valido para a despesa.'),
  invalidProvider: () => new AppError('Informe um fornecedor valido para a despesa.'),
  invalidCategory: () => new AppError('Informe uma categoria valida para a despesa.'),
  invalidAmount: () => new AppError('O valor da despesa deve ser maior que zero.'),
  invalidQuantity: () => new AppError('A quantidade da despesa deve ser um numero valido.'),
  invalidOdometer: () => new AppError('O odometro da despesa deve ser um numero valido.'),
  invalidStatus: () => new AppError('Status da despesa invalido.'),
  vehicleNotFound: () => new AppError('O veiculo informado nao pertence a este tenant.'),
};
