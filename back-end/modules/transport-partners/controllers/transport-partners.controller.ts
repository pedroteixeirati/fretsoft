import express from 'express';
import type { NextFunction, Response } from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { isFeatureEnabled } from '../../../shared/authorization/features';
import { forbiddenError, notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { serializeTransportPartner, serializeTransportPartners } from '../serializers/transport-partners.serializer';
import {
  createTransportPartner,
  createPublicTacRegistration,
  deleteTransportPartner,
  listTransportPartners,
  transportPartnersPermissions,
  updateTransportPartner,
} from '../services/transport-partners.service';

const router = express.Router();

router.post('/public/tenants/:slug/tac-registration', async (req, res, next) => {
  try {
    const registration = await createPublicTacRegistration(req.params.slug, req.body);
    if (!registration) {
      sendErrorResponse(res, notFoundError('Formulario de cadastro nao encontrado.', 'public_tac_registration_not_found'));
      return;
    }

    res.status(201).json(registration);
  } catch (error) {
    next(error);
  }
});

function requireThirdPartyFeature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const features = req.auth?.features;
  if (!isFeatureEnabled(features, 'fiscal') || !isFeatureEnabled(features, 'fiscal.third_party')) {
    sendErrorResponse(res, forbiddenError('Cadastro de transportadores (TAC) requer a feature fiscal.third_party habilitada.', 'fiscal_third_party_disabled'));
    return;
  }
  next();
}

router.get('/transport-partners', loadAuthContext, requireThirdPartyFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', transportPartnersPermissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
      return;
    }

    res.json(serializeTransportPartners(await listTransportPartners(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/transport-partners', loadAuthContext, requireThirdPartyFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', transportPartnersPermissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
      return;
    }

    res.status(201).json(serializeTransportPartner(await createTransportPartner(req.auth, req.body) || {}));
  } catch (error) {
    next(error);
  }
});

router.put('/transport-partners/:id', loadAuthContext, requireThirdPartyFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', transportPartnersPermissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
      return;
    }

    const updated = await updateTransportPartner(req.auth, req.params.id, req.body);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'transport_partner_not_found'));
      return;
    }

    res.json(serializeTransportPartner(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/transport-partners/:id', loadAuthContext, requireThirdPartyFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', transportPartnersPermissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
      return;
    }

    const deleted = await deleteTransportPartner(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'transport_partner_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
