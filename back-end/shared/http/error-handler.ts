import type express from 'express';
import { AppError } from '../errors/app-error';

export function errorHandler(
  error: Error & { code?: string; constraint?: string; statusCode?: number },
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  console.error(error);

  if (error.code === '23505') {
    const messageByConstraint: Record<string, string> = {
      idx_tenants_cnpj_digits: 'Ja existe uma transportadora cadastrada com esse CNPJ.',
      idx_vehicles_tenant_plate: 'Ja existe um veiculo cadastrado com essa placa.',
      idx_companies_tenant_cnpj: 'Ja existe uma empresa cadastrada com esse CNPJ.',
      users_firebase_uid_key: 'Ja existe um usuario cadastrado com esse identificador no Firebase.',
      tenants_slug_key: 'Ja existe uma transportadora cadastrada com esse slug.',
    };

    res.status(409).json({ error: messageByConstraint[error.constraint || ''] || 'Ja existe um registro com esses dados.' });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  res.status(error.statusCode || 500).json({ error: error.message || 'Erro interno do servidor.' });
}
