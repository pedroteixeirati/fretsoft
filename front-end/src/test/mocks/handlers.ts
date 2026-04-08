import { http } from 'msw';

export const handlers = [
  http.get('/health', () => {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
];
