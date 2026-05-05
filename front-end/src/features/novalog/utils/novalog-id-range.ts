export interface NovalogDisplayIdRange {
  from: number;
  to: number;
}

export function parseNovalogDisplayIdRange(value: string): NovalogDisplayIdRange | null {
  const ids = value.match(/\d+/g)?.map(Number).filter((id) => Number.isFinite(id) && id > 0) ?? [];

  if (ids.length === 0) return null;

  const [first, second = first] = ids;

  return {
    from: Math.min(first, second),
    to: Math.max(first, second),
  };
}

export function matchesNovalogDisplayIdRange(displayId: number | undefined, value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return true;
  if (displayId === undefined) return false;

  const range = parseNovalogDisplayIdRange(trimmedValue);
  if (!range) return false;

  return displayId >= range.from && displayId <= range.to;
}
