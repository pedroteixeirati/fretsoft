import type { ContractPayload } from '../dtos/contract.types';

export function serializeContract(contract: ContractPayload | Record<string, unknown>) {
  return { ...contract };
}

export function serializeContracts(contracts: Array<ContractPayload | Record<string, unknown>>) {
  return contracts.map(serializeContract);
}
