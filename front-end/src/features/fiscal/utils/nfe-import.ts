import type { FiscalParty } from '../types/fiscal.types';

export interface NfeImportResult {
  nfeKey: string;
  sender?: FiscalParty;
  recipient?: FiscalParty;
  valorCarga?: number;
  produtoPredominante?: string;
}

function firstByTag(scope: Element | Document, tag: string): Element | null {
  // getElementsByTagNameNS('*', ...) casa pelo nome local, ignorando o prefixo/namespace da NF-e.
  return scope.getElementsByTagNameNS('*', tag)[0] || null;
}

function textOf(scope: Element | Document | null, tag: string): string {
  if (!scope) return '';
  return (firstByTag(scope, tag)?.textContent || '').trim();
}

function partyFromNode(node: Element | null, role: FiscalParty['role'], addrTag: string): FiscalParty | undefined {
  if (!node) return undefined;
  const ender = firstByTag(node, addrTag);
  const cnpj = textOf(node, 'CNPJ');
  const cpf = textOf(node, 'CPF');
  return {
    role,
    name: textOf(node, 'xNome'),
    documentNumber: (cnpj || cpf || '').replace(/\D/g, ''),
    stateRegistration: textOf(node, 'IE'),
    city: textOf(ender, 'xMun'),
    state: textOf(ender, 'UF'),
    phone: textOf(ender, 'fone'),
    street: textOf(ender, 'xLgr'),
    number: textOf(ender, 'nro'),
    district: textOf(ender, 'xBairro'),
    zipCode: textOf(ender, 'CEP'),
    cityIbgeCode: textOf(ender, 'cMun'),
  };
}

export function parseNfeXml(xml: string): NfeImportResult | null {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
  } catch {
    return null;
  }
  if (doc.getElementsByTagName('parsererror').length > 0) return null;

  const infNFe = firstByTag(doc, 'infNFe');
  if (!infNFe) return null;

  const rawKey = (infNFe.getAttribute('Id') || textOf(doc, 'chNFe') || '').replace(/\D/g, '');
  if (rawKey.length !== 44) return null;

  const emit = firstByTag(doc, 'emit');
  const dest = firstByTag(doc, 'dest');
  const total = firstByTag(doc, 'ICMSTot');
  const valor = Number(textOf(total, 'vNF') || textOf(doc, 'vProd') || 0);
  const produto = textOf(doc, 'xProd');

  return {
    nfeKey: rawKey,
    sender: partyFromNode(emit, 'sender', 'enderEmit'),
    recipient: partyFromNode(dest, 'recipient', 'enderDest'),
    valorCarga: Number.isFinite(valor) && valor > 0 ? valor : undefined,
    produtoPredominante: produto || undefined,
  };
}
