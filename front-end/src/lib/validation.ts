export function isValidPlate(value: string) {
  const normalized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalized) || /^[A-Z]{3}[0-9]{4}$/.test(normalized);
}

export function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidStateCode(value: string) {
  return /^[A-Z]{2}$/.test(value.trim().toUpperCase());
}

export function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const calc = (base: string, factors: number[]) => {
    const total = base.split('').reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(cnpj.slice(0, 12) + String(first), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj === `${cnpj.slice(0, 12)}${first}${second}`;
}

export function isValidCpf(value: string) {
  const cpf = normalizeDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const calc = (base: string, factor: number) => {
    const total = base.split('').reduce((sum, digit) => {
      const next = sum + Number(digit) * factor;
      factor -= 1;
      return next;
    }, 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const first = calc(cpf.slice(0, 9), 10);
  const second = calc(cpf.slice(0, 9) + String(first), 11);
  return cpf === `${cpf.slice(0, 9)}${first}${second}`;
}

export function formatCnpj(value: string) {
  const digits = normalizeDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatCpf(value: string) {
  const digits = normalizeDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatPhone(value: string) {
  const digits = normalizeDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}
