import { AppError } from '../../../shared/errors/app-error.ts';

export const cargoErrors = {
  invalidFreight: () => new AppError('Selecione um frete valido para a carga.', { code: 'invalid_cargo_freight', field: 'freightId' }),
  invalidCompany: () => new AppError('Selecione um cliente valido para a carga.', { code: 'invalid_cargo_company', field: 'companyId' }),
  invalidCargoNumber: () => new AppError('Informe um identificador valido para a carga.', { code: 'invalid_cargo_number', field: 'cargoNumber' }),
  invalidDescription: () => new AppError('Informe uma descricao valida para a carga.', { code: 'invalid_cargo_description', field: 'description' }),
  invalidCargoType: () => new AppError('Informe um tipo valido para a carga.', { code: 'invalid_cargo_type', field: 'cargoType' }),
  invalidWeight: () => new AppError('O peso da carga deve ser um numero valido.', { code: 'invalid_cargo_weight', field: 'weight' }),
  invalidVolume: () => new AppError('O volume da carga deve ser um numero valido.', { code: 'invalid_cargo_volume', field: 'volume' }),
  invalidUnitCount: () => new AppError('A quantidade de unidades da carga deve ser um numero valido.', { code: 'invalid_cargo_unit_count', field: 'unitCount' }),
  invalidMerchandiseValue: () => new AppError('O valor da mercadoria deve ser um numero valido.', { code: 'invalid_cargo_merchandise_value', field: 'merchandiseValue' }),
  invalidOrigin: () => new AppError('Informe uma origem valida para a carga.', { code: 'invalid_cargo_origin', field: 'origin' }),
  invalidDestination: () => new AppError('Informe um destino valido para a carga.', { code: 'invalid_cargo_destination', field: 'destination' }),
  invalidStatus: () => new AppError('Status da carga invalido.', { code: 'invalid_cargo_status', field: 'status' }),
  invalidScheduledDate: () => new AppError('Informe uma data prevista valida para a carga.', { code: 'invalid_cargo_scheduled_date', field: 'scheduledDate' }),
  invalidDeliveredAt: () => new AppError('Informe uma data de entrega valida para a carga.', { code: 'invalid_cargo_delivered_at', field: 'deliveredAt' }),
  freightNotFound: () => new AppError('O frete informado nao pertence a este tenant.', { code: 'cargo_freight_not_found', field: 'freightId' }),
  companyNotFound: () => new AppError('O cliente informado nao pertence a este tenant.', { code: 'cargo_company_not_found', field: 'companyId' }),
};
