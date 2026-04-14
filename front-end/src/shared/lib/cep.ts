export type CepLookupResult = {
  zipCode: string;
  addressLine: string;
  district: string;
  city: string;
  state: string;
  ibgeCode: string;
  addressComplement: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean;
};

export function normalizeZipCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 8);
}

export async function lookupAddressByZipCode(zipCode: string): Promise<CepLookupResult> {
  const normalizedZipCode = normalizeZipCode(zipCode);

  if (normalizedZipCode.length !== 8) {
    throw new Error('Informe um CEP com 8 digitos.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o CEP informado.');
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro) {
    throw new Error('CEP nao encontrado.');
  }

  return {
    zipCode: data.cep || zipCode,
    addressLine: data.logradouro || '',
    district: data.bairro || '',
    city: data.localidade || '',
    state: (data.uf || '').toUpperCase(),
    ibgeCode: data.ibge || '',
    addressComplement: data.complemento || '',
  };
}
