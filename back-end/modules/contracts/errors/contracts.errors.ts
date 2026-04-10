import { AppError } from '../../../shared/errors/app-error';

export const contractErrors = {
  invalidCompany: () => new AppError('Selecione uma empresa valida para o contrato.', { code: 'invalid_contract_company', field: 'companyId' }),
  invalidName: () => new AppError('Informe um nome valido para o contrato.', { code: 'invalid_contract_name', field: 'contractName' }),
  invalidRemunerationType: () => new AppError('Tipo de remuneracao invalido.', { code: 'invalid_contract_remuneration_type', field: 'remunerationType' }),
  invalidDates: () => new AppError('As datas do contrato devem ser validas.', { code: 'invalid_contract_dates', field: 'startDate' }),
  invalidDateRange: () => new AppError('A data final do contrato nao pode ser anterior a data inicial.', { code: 'invalid_contract_date_range', field: 'endDate' }),
  invalidStatus: () => new AppError('Status do contrato invalido.', { code: 'invalid_contract_status', field: 'status' }),
  missingVehicles: () => new AppError('Selecione ao menos um caminhao para o contrato.', { code: 'missing_contract_vehicles', field: 'vehicleIds' }),
  companyNotFound: () => new AppError('Empresa contratante nao encontrada neste tenant.', { code: 'contract_company_not_found', field: 'companyId' }),
  vehiclesNotFound: () => new AppError('Um ou mais veiculos selecionados nao pertencem a este tenant.', { code: 'contract_vehicles_not_found', field: 'vehicleIds' }),
  invalidAnnualValue: () => new AppError('Informe um valor anual valido para contratos recorrentes.', { code: 'invalid_contract_annual_value', field: 'annualValue' }),
  invalidMonthlyValue: () => new AppError('O repasse mensal do contrato deve ser valido.', { code: 'invalid_contract_monthly_value', field: 'monthlyValue' }),
};
