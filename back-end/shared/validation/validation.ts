export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim() || '';
  return normalized.length ? normalized : null;
}

export function normalizeRequiredText(value?: string | null) {
  return value?.trim() || '';
}

export function normalizeCnpj(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

export function normalizePhone(value?: string | null) {
  return (value || '').replace(/\D/g, '').slice(0, 11);
}

export function normalizeCpf(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

export function normalizePlate(value?: string | null) {
  return (value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function normalizeOptionalEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase() || '';
  return normalized.length ? normalized : null;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidState(value?: string | null) {
  if (!value) return true;
  return /^[A-Z]{2}$/.test(value.trim().toUpperCase());
}

export function isValidSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isValidTenantStatus(value?: string | null) {
  return !value || ['active', 'inactive', 'suspended'].includes(value);
}

export function isValidPlan(value?: string | null) {
  return !value || ['starter', 'growth', 'enterprise'].includes(value);
}

export function isValidCnpj(cnpj: string) {
  const digits = normalizeCnpj(cnpj);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;

  const calculateDigit = (base: string, factors: number[]) => {
    const total = base
      .split('')
      .reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(digits.slice(0, 12) + String(firstDigit), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits === `${digits.slice(0, 12)}${firstDigit}${secondDigit}`;
}

export function isValidCpf(cpf: string) {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (let index = 0; index < base.length; index += 1) {
      total += Number(base[index]) * (factor - index);
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calc(digits.slice(0, 9), 10);
  const secondDigit = calc(digits.slice(0, 9) + String(firstDigit), 11);
  return digits === `${digits.slice(0, 9)}${firstDigit}${secondDigit}`;
}

export function isValidPhone(phone?: string | null) {
  if (!phone) return true;
  const digits = normalizePhone(phone);
  return digits.length === 10 || digits.length === 11;
}

export function isValidDate(value?: string | null) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export function isValidTime(value?: string | null) {
  if (!value) return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function isValidUuid(value?: string | null) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isValidPlate(value?: string | null) {
  if (!value) return false;
  const normalized = normalizePlate(value);
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalized) || /^[A-Z]{3}[0-9]{4}$/.test(normalized);
}

export function isPositiveNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

export function isNonNegativeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0;
}
