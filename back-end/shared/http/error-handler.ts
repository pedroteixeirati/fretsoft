import type express from 'express';
import { AppError, conflictError } from '../errors/app-error';
import { sendErrorResponse } from './error-response';

export function errorHandler(
  error: Error & { code?: string; constraint?: string; statusCode?: number },
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  console.error(error);

  if (error.code === '23505') {
    const errorByConstraint: Record<string, AppError> = {
      idx_tenants_cnpj_digits: conflictError('Ja existe uma transportadora cadastrada com esse CNPJ.', 'tenant_cnpj_conflict', 'cnpj'),
      idx_vehicles_tenant_plate: conflictError('Ja existe um veiculo cadastrado com essa placa.', 'vehicle_plate_conflict', 'plate'),
      idx_companies_tenant_cnpj: conflictError('Ja existe uma empresa cadastrada com esse CNPJ.', 'company_cnpj_conflict', 'cnpj'),
      users_firebase_uid_key: conflictError('Ja existe um usuario cadastrado com esse identificador no Firebase.', 'firebase_uid_conflict'),
      tenants_slug_key: conflictError('Ja existe uma transportadora cadastrada com esse slug.', 'tenant_slug_conflict', 'slug'),
    };

    sendErrorResponse(res, errorByConstraint[error.constraint || ''] || conflictError('Ja existe um registro com esses dados.', 'resource_conflict'));
    return;
  }

  if (error.code === '23502') {
    sendErrorResponse(
      res,
      new AppError('Um campo obrigatorio do banco nao estava alinhado com o payload enviado.', {
        statusCode: 400,
        code: 'database_not_null_violation',
      })
    );
    return;
  }

  if (error.code === '23503') {
    sendErrorResponse(
      res,
      new AppError('O lancamento depende de um registro relacionado que nao foi encontrado no banco.', {
        statusCode: 409,
        code: 'database_foreign_key_violation',
      })
    );
    return;
  }

  if (error instanceof AppError) {
    sendErrorResponse(res, error);
    return;
  }

  sendErrorResponse(res, new AppError('Erro interno do servidor.', { statusCode: 500, code: 'internal_server_error' }));
}
