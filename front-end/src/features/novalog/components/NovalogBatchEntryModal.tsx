import React, { useMemo, useState } from 'react';
import { Copy, Layers3, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import CustomSelect from '../../../components/CustomSelect';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker } from '../../../shared/forms';
import NovalogAutocompleteSelect from './NovalogAutocompleteSelect';
import {
  getTodayInputDate,
  novalogDestinationOptions,
  novalogFuelStationOptions,
} from '../constants/novalog.constants';
import { NovalogBatchEntryRow, NovalogEntry, NovalogOption } from '../types/novalog.types';
import {
  calculateNovalogEntryAmounts,
  formatNovalogCurrency,
  formatNovalogDecimalInput,
  parseNovalogDecimal,
} from '../utils/novalog.calculations';

type BatchRowField = keyof Pick<
  NovalogBatchEntryRow,
  'destinationName' | 'weight' | 'companyRatePerTon' | 'aggregatedRatePerTon' | 'ticketNumber' | 'fuelStationName'
>;

type BatchRowErrors = Partial<Record<BatchRowField, string>>;

interface NovalogBatchEntryModalProps {
  isOpen: boolean;
  weekNumber: number;
  originOptions: NovalogOption[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (entries: NovalogEntry[]) => void;
}

function createBatchRow(): NovalogBatchEntryRow {
  return {
    id: `batch-row-${Math.random().toString(36).slice(2, 10)}`,
    destinationName: '',
    weight: '',
    companyRatePerTon: '',
    aggregatedRatePerTon: '',
    ticketNumber: '',
    fuelStationName: '',
  };
}

function getInitialRows() {
  return [createBatchRow(), createBatchRow()];
}

export default function NovalogBatchEntryModal({
  isOpen,
  weekNumber,
  originOptions,
  isSubmitting = false,
  onClose,
  onSubmit,
}: NovalogBatchEntryModalProps) {
  const [operationDate, setOperationDate] = useState(getTodayInputDate());
  const [originName, setOriginName] = useState('');
  const [rows, setRows] = useState<NovalogBatchEntryRow[]>(getInitialRows());
  const [submitError, setSubmitError] = useState('');
  const [operationDateError, setOperationDateError] = useState('');
  const [originNameError, setOriginNameError] = useState('');
  const [rowErrors, setRowErrors] = useState<Record<string, BatchRowErrors>>({});

  const lotSummary = useMemo(
    () =>
      rows.reduce(
        (accumulator, row) => {
          const amounts = calculateNovalogEntryAmounts(
            parseNovalogDecimal(row.weight),
            parseNovalogDecimal(row.companyRatePerTon),
            parseNovalogDecimal(row.aggregatedRatePerTon),
          );

          return {
            totalWeight: accumulator.totalWeight + parseNovalogDecimal(row.weight),
            totalCompanyGross: accumulator.totalCompanyGross + amounts.companyGrossAmount,
            totalAggregatedGross: accumulator.totalAggregatedGross + amounts.aggregatedGrossAmount,
            totalDriverNet: accumulator.totalDriverNet + amounts.driverNetAmount,
          };
        },
        {
          totalWeight: 0,
          totalCompanyGross: 0,
          totalAggregatedGross: 0,
          totalDriverNet: 0,
        },
      ),
    [rows],
  );

  const resetForm = () => {
    setOperationDate(getTodayInputDate());
    setOriginName('');
    setRows(getInitialRows());
    setSubmitError('');
    setOperationDateError('');
    setOriginNameError('');
    setRowErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateRow = (rowId: string, field: keyof NovalogBatchEntryRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
    setRowErrors((current) => {
      const currentRowErrors = current[rowId];
      if (!currentRowErrors?.[field as BatchRowField]) return current;

      const nextRowErrors = { ...currentRowErrors };
      delete nextRowErrors[field as BatchRowField];

      if (Object.keys(nextRowErrors).length === 0) {
        const nextErrors = { ...current };
        delete nextErrors[rowId];
        return nextErrors;
      }

      return { ...current, [rowId]: nextRowErrors };
    });
  };

  const addRow = () => {
    setRows((current) => [...current, createBatchRow()]);
  };

  const duplicateRow = (rowId: string) => {
    setRows((current) => {
      const row = current.find((item) => item.id === rowId);
      if (!row) return current;
      return [...current, { ...row, id: `batch-row-${Math.random().toString(36).slice(2, 10)}` }];
    });
  };

  const removeRow = (rowId: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== rowId)));
    setRowErrors((current) => {
      if (!current[rowId]) return current;
      const nextErrors = { ...current };
      delete nextErrors[rowId];
      return nextErrors;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    let hasErrors = false;
    const nextRowErrors: Record<string, BatchRowErrors> = {};

    if (!operationDate) {
      setOperationDateError('Informe a data do lote.');
      hasErrors = true;
    } else {
      setOperationDateError('');
    }

    if (originName.trim().length < 2) {
      setOriginNameError('Selecione a mineradora de origem do lote.');
      hasErrors = true;
    } else {
      setOriginNameError('');
    }

    rows.forEach((row) => {
      const errors: BatchRowErrors = {};

      if (row.destinationName.trim().length < 2) errors.destinationName = 'Selecione o destino.';
      if (parseNovalogDecimal(row.weight) <= 0) errors.weight = 'Informe um peso maior que zero.';
      if (row.ticketNumber.trim().length === 0) errors.ticketNumber = 'Informe o ticket.';
      if (parseNovalogDecimal(row.companyRatePerTon) <= 0) errors.companyRatePerTon = 'Informe o valor empresa.';
      if (parseNovalogDecimal(row.aggregatedRatePerTon) <= 0) errors.aggregatedRatePerTon = 'Informe o valor terceiro.';
      if (row.fuelStationName.trim().length < 2) errors.fuelStationName = 'Selecione o posto.';

      if (Object.keys(errors).length > 0) {
        nextRowErrors[row.id] = errors;
        hasErrors = true;
      }
    });

    setRowErrors(nextRowErrors);

    if (hasErrors) {
      setSubmitError('Preencha todos os campos obrigatorios do lote antes de salvar.');
      return;
    }

    setSubmitError('');

    const entries: NovalogEntry[] = rows.map((row) => {
      const amounts = calculateNovalogEntryAmounts(parseNovalogDecimal(row.weight), parseNovalogDecimal(row.companyRatePerTon), parseNovalogDecimal(row.aggregatedRatePerTon));
      return {
        id: `novalog-entry-${Date.now()}-${row.id}`,
        weekNumber,
        operationDate,
        originName: originName.trim(),
        destinationName: row.destinationName.trim(),
        weight: parseNovalogDecimal(row.weight),
        companyRatePerTon: parseNovalogDecimal(row.companyRatePerTon),
        companyGrossAmount: amounts.companyGrossAmount,
        aggregatedRatePerTon: parseNovalogDecimal(row.aggregatedRatePerTon),
        aggregatedGrossAmount: amounts.aggregatedGrossAmount,
        ticketNumber: row.ticketNumber.trim(),
        fuelStationName: row.fuelStationName.trim(),
        entryMode: 'batch',
      };
    });

    onSubmit(entries);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo lote Novalog"
      panelClassName="max-w-[min(92vw,1280px)]"
      contentClassName="xl:px-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormAlert message={submitError} variant="error" />

        <section className="grid gap-4 md:grid-cols-2 xl:max-w-[860px]">
          <div className="max-w-[420px]">
            <FormDatePicker label="Data do lote" value={operationDate} onChange={(value) => {
              setOperationDate(value);
              setOperationDateError('');
            }} error={operationDateError} />
          </div>
          <div className="max-w-[420px] space-y-2">
            <FieldLabel required>Origem (mineradora)</FieldLabel>
            <CustomSelect value={originName} onChange={(value) => {
              setOriginName(value);
              setOriginNameError('');
            }} options={originOptions} placeholder="Selecione a mineradora" error={originNameError} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Linhas do lote</h3>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-4 py-2 text-xs font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 text-primary" />
              Adicionar linha
            </button>
          </div>

          <div className="space-y-4 xl:hidden">
            {rows.map((row, index) => (
              <article key={row.id} className="rounded-[1.8rem] border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Linha {index + 1}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">Destino, peso, valores e dados da viagem.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => duplicateRow(row.id)} className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5">
                      <Copy className="h-4 w-4 text-primary" />
                      
                    </button>
                    <button type="button" onClick={() => removeRow(row.id)} className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error/5 px-3 py-2 text-xs font-bold text-error transition hover:bg-error/10">
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-4">
                  <div className="space-y-2">
                    <FieldLabel required>Destino</FieldLabel>
                    <NovalogAutocompleteSelect value={row.destinationName} onChange={(value) => updateRow(row.id, 'destinationName', value)} options={novalogDestinationOptions} placeholder="Destino" error={rowErrors[row.id]?.destinationName} />
                  </div>
                  <Input label="Peso (t)" type="text" inputMode="numeric" value={row.weight} onChange={(event) => updateRow(row.id, 'weight', formatNovalogDecimalInput(event.target.value))} placeholder="0,00" error={rowErrors[row.id]?.weight} />
                  <Input label="Ticket" value={row.ticketNumber} onChange={(event) => updateRow(row.id, 'ticketNumber', event.target.value)} placeholder="Ex: 154230" error={rowErrors[row.id]?.ticketNumber} />
                  <Input label="Valor frete empresa" type="text" inputMode="numeric" value={row.companyRatePerTon} onChange={(event) => updateRow(row.id, 'companyRatePerTon', formatNovalogDecimalInput(event.target.value))} placeholder="0,00" error={rowErrors[row.id]?.companyRatePerTon} />
                  <Input label="Valor frete terceiro" type="text" inputMode="numeric" value={row.aggregatedRatePerTon} onChange={(event) => updateRow(row.id, 'aggregatedRatePerTon', formatNovalogDecimalInput(event.target.value))} placeholder="0,00" error={rowErrors[row.id]?.aggregatedRatePerTon} />
                  <div className="space-y-2">
                    <FieldLabel required>Posto</FieldLabel>
                    <NovalogAutocompleteSelect value={row.fuelStationName} onChange={(value) => updateRow(row.id, 'fuelStationName', value)} options={novalogFuelStationOptions} placeholder="Posto" error={rowErrors[row.id]?.fuelStationName} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[1.8rem] border border-outline-variant/15 bg-surface-container-lowest shadow-sm xl:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Destino</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Peso (t)</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Ticket</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Valor frete empresa</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Valor frete terceiro</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Posto</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {rows.map((row, index) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-4 min-w-[220px]">
                        <NovalogAutocompleteSelect value={row.destinationName} onChange={(value) => updateRow(row.id, 'destinationName', value)} options={novalogDestinationOptions} placeholder="Destino" error={rowErrors[row.id]?.destinationName} />
                      </td>
                      <td className="px-4 py-4 min-w-[150px]">
                        <Input type="text" inputMode="numeric" value={row.weight} onChange={(event) => updateRow(row.id, 'weight', formatNovalogDecimalInput(event.target.value))} placeholder="0,00" containerClassName="min-w-0" error={rowErrors[row.id]?.weight} />
                      </td>
                      <td className="px-4 py-4 min-w-[160px]">
                        <Input value={row.ticketNumber} onChange={(event) => updateRow(row.id, 'ticketNumber', event.target.value)} placeholder="Ex: 154230" containerClassName="min-w-0" error={rowErrors[row.id]?.ticketNumber} />
                      </td>
                      <td className="px-4 py-4 min-w-[180px]">
                        <Input type="text" inputMode="numeric" value={row.companyRatePerTon} onChange={(event) => updateRow(row.id, 'companyRatePerTon', formatNovalogDecimalInput(event.target.value))} placeholder="0,00" containerClassName="min-w-0" error={rowErrors[row.id]?.companyRatePerTon} />
                      </td>
                      <td className="px-4 py-4 min-w-[180px]">
                        <Input type="text" inputMode="numeric" value={row.aggregatedRatePerTon} onChange={(event) => updateRow(row.id, 'aggregatedRatePerTon', formatNovalogDecimalInput(event.target.value))} placeholder="0,00" containerClassName="min-w-0" error={rowErrors[row.id]?.aggregatedRatePerTon} />
                      </td>
                      <td className="px-4 py-4 min-w-[190px]">
                        <NovalogAutocompleteSelect value={row.fuelStationName} onChange={(value) => updateRow(row.id, 'fuelStationName', value)} options={novalogFuelStationOptions} placeholder="Posto" error={rowErrors[row.id]?.fuelStationName} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[170px] items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateRow(row.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5"
                          >
                            <Copy className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error/5 px-3 py-2 text-xs font-bold text-error transition hover:bg-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-outline-variant/12 bg-surface-container-low/40 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Peso total</p>
              <p className="mt-1 text-sm font-black text-on-surface">
                {lotSummary.totalWeight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total empresa</p>
              <p className="mt-1 text-sm font-black text-primary">{formatNovalogCurrency(lotSummary.totalCompanyGross)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total terceiro</p>
              <p className="mt-1 text-sm font-black text-secondary">{formatNovalogCurrency(lotSummary.totalAggregatedGross)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total motorista</p>
              <p className="mt-1 text-sm font-black text-on-surface">{formatNovalogCurrency(lotSummary.totalDriverNet)}</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={handleClose} disabled={isSubmitting} className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95">
            {isSubmitting ? 'Salvando lote...' : 'Salvar lote'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
