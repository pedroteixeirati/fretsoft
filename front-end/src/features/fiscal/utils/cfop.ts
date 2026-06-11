// Sugestao de CFOP para prestacao de servico de transporte (CT-e):
// mesma UF => 5xxx (estadual), UFs diferentes => 6xxx (interestadual).
// E um default editavel, nao uma apuracao fiscal — sempre confirmar com o contador.
export function suggestCfop(ufOrigem?: string, ufDestino?: string): string | undefined {
  const origem = (ufOrigem || '').trim().toUpperCase();
  const destino = (ufDestino || '').trim().toUpperCase();
  if (origem.length !== 2 || destino.length !== 2) return undefined;
  return origem === destino ? '5353' : '6353';
}

// CST ICMS padrao para tributacao normal (Regime Normal). Editavel.
export const DEFAULT_ICMS_CST = '00';
