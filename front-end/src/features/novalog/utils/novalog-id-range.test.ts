import { describe, expect, it } from 'vitest';
import { matchesNovalogDisplayIdRange, parseNovalogDisplayIdRange } from './novalog-id-range';

describe('novalog-id-range', () => {
  it('interpreta um unico ID como intervalo fechado do mesmo identificador', () => {
    expect(parseNovalogDisplayIdRange('460')).toEqual({ from: 460, to: 460 });
    expect(matchesNovalogDisplayIdRange(460, '460')).toBe(true);
    expect(matchesNovalogDisplayIdRange(461, '460')).toBe(false);
  });

  it('interpreta intervalo de display_id em qualquer ordem', () => {
    expect(parseNovalogDisplayIdRange('460-570')).toEqual({ from: 460, to: 570 });
    expect(parseNovalogDisplayIdRange('570 ate 460')).toEqual({ from: 460, to: 570 });
    expect(matchesNovalogDisplayIdRange(500, '460 a 570')).toBe(true);
    expect(matchesNovalogDisplayIdRange(571, '460 a 570')).toBe(false);
  });

  it('mantem filtro vazio sem restringir a lista e rejeita texto sem ID', () => {
    expect(matchesNovalogDisplayIdRange(undefined, '')).toBe(true);
    expect(matchesNovalogDisplayIdRange(460, 'abc')).toBe(false);
  });
});
