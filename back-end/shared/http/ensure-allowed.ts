import type { Response } from 'express';

export function ensureAllowed(res: Response, allowed: boolean, message: string) {
  if (!allowed) {
    res.status(403).json({ error: message });
    return false;
  }
  return true;
}
