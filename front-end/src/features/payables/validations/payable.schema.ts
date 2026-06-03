import { z } from 'zod';

export const payableSchema = z.object({
  sourceType: z.enum(['manual', 'expense']).default('manual'),
  sourceId: z.string().optional().default(''),
  description: z.string().trim().min(1, 'Informe a descricao da conta a pagar.'),
  providerName: z.string().optional().default(''),
  vehicleId: z.string().optional().default(''),
  contractId: z.string().optional().default(''),
  amount: z.coerce.number().positive('Informe um valor maior que zero.'),
  dueDate: z.string().min(1, 'Informe a data de vencimento.'),
  status: z.enum(['open', 'paid', 'overdue', 'canceled']).default('open'),
  paidAt: z.string().optional().default(''),
  paymentMethod: z.string().optional().default(''),
  proofUrl: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  documentNumber: z.string().optional().default(''),
  invoiceNumber: z.string().optional().default(''),
  invoiceStatus: z.enum(['informed', 'missing', 'not_informed']).default('not_informed'),
  referenceMonth: z.string().optional().default(''),
}).superRefine((data, ctx) => {
  if (data.sourceType === 'expense' && !data.sourceId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceId'],
      message: 'Informe o ID da origem quando a conta vier de custo operacional.',
    });
  }

  if (data.status === 'paid' && !data.paidAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['paidAt'],
      message: 'Informe a data do pagamento quando a conta estiver paga.',
    });
  }

  if (data.referenceMonth && !/^\d{4}-\d{2}$/.test(data.referenceMonth)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['referenceMonth'],
      message: 'Informe a competencia no formato AAAA-MM.',
    });
  }
});

export type PayableFormValues = z.input<typeof payableSchema>;
