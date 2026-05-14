import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const revenuesPageSource = readFileSync(resolve(process.cwd(), 'front-end/src/pages/Revenues.tsx'), 'utf8');
const paymentModalSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/revenues/components/RevenuePaymentModal.tsx'), 'utf8');
const apiSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/revenues/services/revenues.api.ts'), 'utf8');
const confirmDialogSource = readFileSync(resolve(process.cwd(), 'front-end/src/shared/ui/ConfirmDialog.tsx'), 'utf8');

describe('RevenuesPage payment reversal contract', () => {
  it('abre detalhes do recebivel e estorna pagamentos pelo endpoint dedicado', () => {
    expect(revenuesPageSource).toMatch(/Detalhes do recebivel/);
    expect(revenuesPageSource).toMatch(/handleReversePayment/);
    expect(apiSource).toMatch(/payments\/\$\{paymentId\}\/reverse/);
  });

  it('mantem historico com pagamento estornado sem entrar no fluxo de novo recebimento', () => {
    expect(paymentModalSource).toMatch(/Estornado/);
    expect(paymentModalSource).toMatch(/reversalReason/);
    expect(paymentModalSource).toMatch(/Estornar pagamento/);
  });

  it('usa confirmacao reutilizavel para a acao critica de estorno', () => {
    expect(paymentModalSource).toMatch(/ConfirmDialog/);
    expect(confirmDialogSource).toMatch(/variant.*danger/s);
    expect(confirmDialogSource).toMatch(/confirmLabel/);
    expect(confirmDialogSource).toMatch(/isLoading/);
  });

  it('confirma o registro de recebimento antes de persistir pagamento', () => {
    expect(paymentModalSource).toMatch(/Registrar recebimento\?/);
    expect(paymentModalSource).toMatch(/handleRequestPaymentConfirmation/);
    expect(paymentModalSource).toMatch(/Saldo apos pagamento/);
    expect(paymentModalSource).toMatch(/handleConfirmPayment/);
  });
});
