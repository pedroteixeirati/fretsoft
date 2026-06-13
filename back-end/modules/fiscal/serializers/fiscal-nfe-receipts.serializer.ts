export function serializeNfeReceipt(receipt: Record<string, unknown>) {
  return receipt;
}

export function serializeNfeReceipts(receipts: Array<Record<string, unknown>>) {
  return receipts.map(serializeNfeReceipt);
}
