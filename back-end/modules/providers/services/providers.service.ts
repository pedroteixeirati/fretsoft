import { validationError } from '../../../shared/errors/app-error';
import {
  isValidEmail,
  normalizeRequiredText,
} from '../../../shared/validation/validation';

export async function validateProviderPayload(body: Record<string, unknown>) {
  const name = normalizeRequiredText(body.name as string);
  const type = normalizeRequiredText(body.type as string);
  const status = normalizeRequiredText(body.status as string);
  const contact = normalizeRequiredText(body.contact as string);
  const email = normalizeRequiredText(body.email as string).toLowerCase();
  const address = normalizeRequiredText(body.address as string);

  if (name.length < 3) throw validationError('Informe um nome valido para o fornecedor.', 'invalid_provider_name', 'name');
  if (type.length < 2) throw validationError('Informe o tipo do fornecedor.', 'invalid_provider_type', 'type');
  if (status.length < 2) throw validationError('Informe o status do fornecedor.', 'invalid_provider_status', 'status');
  if (email && !isValidEmail(email)) throw validationError('Informe um e-mail valido para o fornecedor.', 'invalid_provider_email', 'email');

  return { name, type, status, contact, email, address };
}
