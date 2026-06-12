import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  cargoInsurancePolicyPermissions,
  createCargoInsurancePolicy,
  deleteCargoInsurancePolicy,
  listCargoInsurancePolicies,
  updateCargoInsurancePolicy,
} from '../services/cargo-insurance-policies.service';
import { serializeCargoInsurancePolicies, serializeCargoInsurancePolicy } from '../serializers/cargo-insurance-policies.serializer';

const router = express.Router();

router.get('/fiscal/cargo-insurance-policies', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', cargoInsurancePolicyPermissions, req.auth?.role), 'Sem permissao para visualizar apolices de seguro.')) return;
    res.json(serializeCargoInsurancePolicies(await listCargoInsurancePolicies(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/cargo-insurance-policies', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', cargoInsurancePolicyPermissions, req.auth?.role), 'Sem permissao para criar apolices de seguro.')) return;
    res.status(201).json(serializeCargoInsurancePolicy(await createCargoInsurancePolicy(req.auth, req.body as Record<string, unknown>) || {}));
  } catch (error) {
    next(error);
  }
});

router.put('/fiscal/cargo-insurance-policies/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', cargoInsurancePolicyPermissions, req.auth?.role), 'Sem permissao para editar apolices de seguro.')) return;
    const updated = await updateCargoInsurancePolicy(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Apolice de seguro nao encontrada.', 'cargo_insurance_policy_not_found'));
      return;
    }
    res.json(serializeCargoInsurancePolicy(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/fiscal/cargo-insurance-policies/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', cargoInsurancePolicyPermissions, req.auth?.role), 'Sem permissao para excluir apolices de seguro.')) return;
    const deleted = await deleteCargoInsurancePolicy(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Apolice de seguro nao encontrada.', 'cargo_insurance_policy_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
