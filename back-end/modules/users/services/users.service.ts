import { adminAuth } from '../../../shared/infra/firebase/firebaseAdmin';
import { conflictError, forbiddenError, validationError } from '../../../shared/errors/app-error';
import { pool } from '../../../shared/infra/database/pool';
import type { AppRole } from '../../../shared/authorization/permissions';
import { isValidEmail, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { findUserByEmail, insertTenantUser, linkUserToTenant } from '../repositories/users.repository';
import type { CreateTenantUserInput } from '../dtos/user.types';

function allowedRolesForCreator(role?: AppRole): AppRole[] {
  return role === 'dev'
    ? ['admin', 'financial', 'operational', 'driver', 'viewer']
    : ['financial', 'operational', 'driver', 'viewer'];
}

export function canCreateTenantUsers(role?: AppRole) {
  return !!role && ['dev', 'owner', 'admin'].includes(role);
}

export async function createTenantUser(auth: AuthContext | undefined, payload: CreateTenantUserInput) {
  const client = await pool.connect();
  let createdFirebaseUid: string | null = null;
  let transactionStarted = false;

  try {
    const normalizedEmail = normalizeRequiredText(payload.email).toLowerCase();
    const normalizedName = normalizeRequiredText(payload.name);
    const normalizedPassword = payload.password || '';

    if (auth?.role !== 'dev' && payload.role === 'admin') {
      throw forbiddenError('Apenas o perfil dev pode promover usuarios para admin.', 'admin_promotion_forbidden');
    }

    const allowedRoles = allowedRolesForCreator(auth?.role);
    if (!allowedRoles.includes(payload.role)) {
      throw validationError('Perfil de acesso invalido para cadastro.', 'invalid_user_role', 'role');
    }

    if (!isValidEmail(normalizedEmail)) {
      throw validationError('Informe um e-mail valido para o usuario.', 'invalid_user_email', 'email');
    }

    if (normalizedPassword.length < 6) {
      throw validationError('A senha inicial deve ter pelo menos 6 caracteres.', 'invalid_user_password', 'password');
    }

    const existingUser = await findUserByEmail(client, normalizedEmail);
    if (existingUser) {
      throw conflictError('Ja existe um usuario cadastrado com esse e-mail.', 'user_email_conflict', 'email');
    }

    try {
      const firebaseUser = await adminAuth.createUser({
        email: normalizedEmail,
        password: normalizedPassword,
        displayName: normalizedName || undefined,
      });
      createdFirebaseUid = firebaseUser.uid;
    } catch (firebaseError: any) {
      const code = firebaseError?.code || '';
      if (code.includes('email-already-exists')) {
        throw conflictError('Ja existe um usuario no Firebase com esse e-mail.', 'firebase_user_email_conflict', 'email');
      }
      if (code.includes('invalid-password')) {
        throw validationError('A senha inicial do usuario nao atende aos requisitos do Firebase.', 'invalid_firebase_user_password', 'password');
      }
      throw firebaseError;
    }

    await client.query('begin');
    transactionStarted = true;

    const user = await insertTenantUser(client, createdFirebaseUid!, normalizedEmail, payload.role, normalizedName || null);
    await linkUserToTenant(client, auth?.tenantId || '', user.id, payload.role);
    await client.query('commit');

    return {
      uid: user.firebase_uid,
      email: user.email,
      role: payload.role,
      name: user.name,
      tenantId: auth?.tenantId,
      tenantName: auth?.tenantName,
      tenantSlug: auth?.tenantSlug,
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query('rollback');
    }
    if (createdFirebaseUid) {
      await adminAuth.deleteUser(createdFirebaseUid).catch(() => undefined);
    }
    throw error;
  } finally {
    client.release();
  }
}
