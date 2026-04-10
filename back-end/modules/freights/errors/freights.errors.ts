import { AppError } from '../../../shared/errors/app-error';

export const freightErrors = {
  invalidVehicle: () => new AppError('Selecione um veiculo valido para o frete.', { code: 'invalid_freight_vehicle', field: 'vehicleId' }),
  invalidContract: () => new AppError('Selecione um contrato valido para vincular ao frete.', { code: 'invalid_freight_contract', field: 'contractId' }),
  invalidDate: () => new AppError('Informe uma data valida para o frete.', { code: 'invalid_freight_date', field: 'date' }),
  invalidRoute: () => new AppError('Informe uma rota valida para o frete.', { code: 'invalid_freight_route', field: 'route' }),
  invalidAmount: () => new AppError('O valor do frete deve ser um numero valido.', { code: 'invalid_freight_amount', field: 'amount' }),
  vehicleNotFound: () => new AppError('O veiculo informado nao pertence a este tenant.', { code: 'freight_vehicle_not_found', field: 'vehicleId' }),
  contractNotFound: () => new AppError('O contrato informado nao pertence a este tenant.', { code: 'freight_contract_not_found', field: 'contractId' }),
  vehicleNotLinked: () => new AppError('O veiculo selecionado nao esta vinculado a este contrato.', { code: 'freight_vehicle_not_linked', field: 'vehicleId' }),
  perTripAmountRequired: () => new AppError('Informe o valor do frete para contratos por viagem.', { code: 'freight_per_trip_amount_required', field: 'amount' }),
  standaloneAmountRequired: () => new AppError('O valor do frete deve ser maior que zero para fretes avulsos.', { code: 'freight_standalone_amount_required', field: 'amount' }),
};
