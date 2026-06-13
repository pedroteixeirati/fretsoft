import { validationError } from '../../../shared/errors/app-error';
import type { FiscalNfePartySnapshot, FiscalNfeProductSnapshot, FiscalNfeTotalsSnapshot } from '../dtos/fiscal-nfe-receipt.types';

export interface ParsedNfeXml {
  nfeKey: string;
  issueDate: string;
  senderSnapshot: FiscalNfePartySnapshot;
  recipientSnapshot: FiscalNfePartySnapshot;
  totalsSnapshot: FiscalNfeTotalsSnapshot;
  productSnapshot: FiscalNfeProductSnapshot;
}

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function firstTagXml(scope: string, tag: string) {
  const pattern = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'i');
  return pattern.exec(scope)?.[1] || '';
}

function textOf(scope: string, tag: string) {
  return stripCdata(firstTagXml(scope, tag).replace(/<[^>]+>/g, ''));
}

function firstNode(xml: string, tag: string) {
  return firstTagXml(xml, tag);
}

function attrOf(xml: string, tag: string, attr: string) {
  const pattern = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, 'i');
  return pattern.exec(xml)?.[1] || '';
}

function digits(value: string) {
  return value.replace(/\D/g, '');
}

function numberFromText(value: string) {
  const normalized = value.replace(',', '.').trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function partyFromNode(node: string, addrTag: string): FiscalNfePartySnapshot {
  const address = firstNode(node, addrTag);
  return {
    name: textOf(node, 'xNome'),
    documentNumber: digits(textOf(node, 'CNPJ') || textOf(node, 'CPF')),
    stateRegistration: textOf(node, 'IE'),
    city: textOf(address, 'xMun'),
    state: textOf(address, 'UF').toUpperCase(),
    phone: digits(textOf(address, 'fone')),
    street: textOf(address, 'xLgr'),
    number: textOf(address, 'nro'),
    district: textOf(address, 'xBairro'),
    zipCode: digits(textOf(address, 'CEP')),
    cityIbgeCode: digits(textOf(address, 'cMun')),
  };
}

export function parseNfeXml(xml: string): ParsedNfeXml {
  const normalizedXml = xml.trim();
  if (!normalizedXml || !/<(?:\w+:)?NFe\b/i.test(normalizedXml)) {
    throw validationError('Arquivo nao parece ser uma NF-e valida.', 'invalid_nfe_xml', 'xml');
  }

  const infNFe = firstNode(normalizedXml, 'infNFe');
  if (!infNFe) {
    throw validationError('XML da NF-e sem bloco infNFe.', 'invalid_nfe_xml', 'xml');
  }

  const nfeKey = digits(attrOf(normalizedXml, 'infNFe', 'Id') || textOf(normalizedXml, 'chNFe'));
  if (nfeKey.length !== 44) {
    throw validationError('Chave da NF-e invalida ou ausente.', 'invalid_nfe_key', 'nfeKey');
  }

  const emit = firstNode(normalizedXml, 'emit');
  const dest = firstNode(normalizedXml, 'dest');
  if (!emit || !dest) {
    throw validationError('XML da NF-e sem remetente ou destinatario.', 'invalid_nfe_parties', 'xml');
  }

  const total = firstNode(normalizedXml, 'ICMSTot');
  const transp = firstNode(normalizedXml, 'transp');
  const vol = firstNode(transp || normalizedXml, 'vol');
  const firstProduct = firstNode(normalizedXml, 'prod');
  const issueDate = textOf(normalizedXml, 'dhEmi').slice(0, 10) || textOf(normalizedXml, 'dEmi').slice(0, 10);

  return {
    nfeKey,
    issueDate,
    senderSnapshot: partyFromNode(emit, 'enderEmit'),
    recipientSnapshot: partyFromNode(dest, 'enderDest'),
    totalsSnapshot: {
      invoiceAmount: numberFromText(textOf(total, 'vNF')),
      productAmount: numberFromText(textOf(total, 'vProd')),
      weight: numberFromText(textOf(vol, 'pesoB')),
    },
    productSnapshot: {
      predominantProduct: textOf(firstProduct, 'xProd'),
      ncm: digits(textOf(firstProduct, 'NCM')),
    },
  };
}
