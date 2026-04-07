import { AppError } from '../../../shared/errors/app-error';

export const contractErrors = {
  invalidCompany: () => new AppError('Selecione uma empresa valida para o contrato.'),
  invalidName: () => new AppError('Informe um nome valido para o contrato.'),
  invalidRemunerationType: () => new AppError('Tipo de remuneracao invalido.'),
  invalidDates: () => new AppError('As datas do contrato devem ser validas.'),
  invalidDateRange: () => new AppError('A data final do contrato nao pode ser anterior a data inicial.'),
  invalidStatus: () => new AppError('Status do contrato invalido.'),
  missingVehicles: () => new AppError('Selecione ao menos um caminhao para o contrato.'),
  companyNotFound: () => new AppError('Empresa contratante nao encontrada neste tenant.'),
  vehiclesNotFound: () => new AppError('Um ou mais veiculos selecionados nao pertencem a este tenant.'),
  invalidAnnualValue: () => new AppError('Informe um valor anual valido para contratos recorrentes.'),
  invalidMonthlyValue: () => new AppError('O repasse mensal do contrato deve ser valido.'),
};
