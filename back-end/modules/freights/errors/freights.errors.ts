import { AppError } from '../../../shared/errors/app-error';

export const freightErrors = {
  invalidVehicle: () => new AppError('Selecione um veiculo valido para o frete.'),
  invalidContract: () => new AppError('Selecione um contrato valido para vincular ao frete.'),
  invalidDate: () => new AppError('Informe uma data valida para o frete.'),
  invalidRoute: () => new AppError('Informe uma rota valida para o frete.'),
  invalidAmount: () => new AppError('O valor do frete deve ser um numero valido.'),
  vehicleNotFound: () => new AppError('O veiculo informado nao pertence a este tenant.'),
  contractNotFound: () => new AppError('O contrato informado nao pertence a este tenant.'),
  vehicleNotLinked: () => new AppError('O veiculo selecionado nao esta vinculado a este contrato.'),
  perTripAmountRequired: () => new AppError('Informe o valor do frete para contratos por viagem.'),
  standaloneAmountRequired: () => new AppError('O valor do frete deve ser maior que zero para fretes avulsos.'),
};
