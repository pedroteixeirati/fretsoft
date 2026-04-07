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

  if (name.length < 3) throw new Error('Informe um nome valido para o fornecedor.');
  if (type.length < 2) throw new Error('Informe o tipo do fornecedor.');
  if (status.length < 2) throw new Error('Informe o status do fornecedor.');
  if (contact.length < 3) throw new Error('Informe um contato valido para o fornecedor.');
  if (!isValidEmail(email)) throw new Error('Informe um e-mail valido para o fornecedor.');
  if (address.length < 5) throw new Error('Informe um endereco valido para o fornecedor.');

  return { name, type, status, contact, email, address };
}
