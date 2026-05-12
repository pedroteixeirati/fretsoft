import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, PackagePlus, Pickaxe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import KpiCard from '../../../components/KpiCard';
import CustomSelect from '../../../components/CustomSelect';
import { useFirebase } from '../../../context/FirebaseContext';
import { canAccess } from '../../../lib/permissions';
import { queryKeys } from '../../../shared/lib/query-keys';
import { providersApi } from '../../providers/services/providers.api';
import { companiesApi } from '../../companies/services/companies.api';
import { canAccessNovalogOperations } from '../utils/novalog.visibility';
import { novalogInitialKpis, novalogKpiIcons } from '../constants/novalog.constants';
import { novalogApi } from '../services/novalog.api';
import NovalogEntriesTable from '../components/NovalogEntriesTable';
import { formatNovalogCurrency } from '../utils/novalog.calculations';
import { matchesNovalogDisplayIdRange } from '../utils/novalog-id-range';
import NovalogStandardEntryModal from '../components/NovalogStandardEntryModal';
import NovalogBatchEntryModal from '../components/NovalogBatchEntryModal';
import { NovalogEntry } from '../types/novalog.types';
import { useNovalogQuery } from '../hooks/useNovalogQuery';
import { useNovalogMutations } from '../hooks/useNovalogMutations';

type StandardModalMode = 'create' | 'edit' | 'duplicate';
const itemsPerPage = 20;

function getCurrentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatReferenceMonthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export default function NovalogOperationsPage() {
  const { userProfile } = useFirebase();
  const [selectedReferenceMonth, setSelectedReferenceMonth] = useState(getCurrentReferenceMonth);
  const [knownReferenceMonths, setKnownReferenceMonths] = useState<string[]>(() => [getCurrentReferenceMonth()]);
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [standardModalMode, setStandardModalMode] = useState<StandardModalMode>('create');
  const [draftEntry, setDraftEntry] = useState<NovalogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [fuelStationFilter, setFuelStationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const canAccessNovalogModule = canAccessNovalogOperations(userProfile);
  const canReadProviders = canAccessNovalogModule && canAccess(userProfile, 'providers', 'read');
  const canReadCompanies = canAccessNovalogModule && canAccess(userProfile, 'companies', 'read');
  const { entries, isLoading, error } = useNovalogQuery(canAccessNovalogModule, selectedReferenceMonth);
  const referenceMonthsQuery = useQuery({
    queryKey: queryKeys.novalog.referenceMonths(),
    queryFn: novalogApi.listReferenceMonths,
    enabled: canAccessNovalogModule,
  });
  const providersQuery = useQuery({
    queryKey: queryKeys.providers.list(),
    queryFn: providersApi.list,
    enabled: canReadProviders,
  });
  const companiesQuery = useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: companiesApi.list,
    enabled: canReadCompanies,
  });
  const { createEntry, createBatch, updateEntry, deleteEntry, isSubmitting } = useNovalogMutations();
  const mutationError = createEntry.error ?? createBatch.error ?? updateEntry.error ?? deleteEntry.error ?? null;

  const openCreateModal = () => {
    setStandardModalMode('create');
    setDraftEntry(null);
    setIsStandardModalOpen(true);
  };

  const openEditModal = (entry: NovalogEntry) => {
    setStandardModalMode('edit');
    setDraftEntry(entry);
    setSelectedReferenceMonth(entry.referenceMonth || entry.operationDate.slice(0, 7));
    setIsStandardModalOpen(true);
  };

  const openDuplicateModal = (entry: NovalogEntry) => {
    setStandardModalMode('duplicate');
    setDraftEntry(entry);
    setSelectedReferenceMonth(entry.referenceMonth || entry.operationDate.slice(0, 7));
    setIsStandardModalOpen(true);
  };

  const closeStandardModal = () => {
    setIsStandardModalOpen(false);
    setDraftEntry(null);
    setStandardModalMode('create');
  };

  const handleStandardSubmit = async (entry: NovalogEntry) => {
    const entryReferenceMonth = entry.referenceMonth || entry.operationDate.slice(0, 7);

    if (standardModalMode === 'edit' && draftEntry) {
      await updateEntry.mutateAsync({ id: draftEntry.id, payload: entry });
      setSelectedReferenceMonth(entryReferenceMonth);
      setKnownReferenceMonths((current) => Array.from(new Set([entryReferenceMonth, ...current])));
      closeStandardModal();
      return;
    }

    await createEntry.mutateAsync(entry);
    setSelectedReferenceMonth(entryReferenceMonth);
    setKnownReferenceMonths((current) => Array.from(new Set([entryReferenceMonth, ...current])));
    closeStandardModal();
  };

  const handleBatchSubmit = async (newEntries: NovalogEntry[]) => {
    if (newEntries.length === 0) return;

    await createBatch.mutateAsync({
      weekNumber: newEntries[0].weekNumber,
      operationDate: newEntries[0].operationDate,
      originName: newEntries[0].originName,
      entries: newEntries.map((entry) => ({
        destinationName: entry.destinationName,
        weight: entry.weight,
        companyRatePerTon: entry.companyRatePerTon,
        aggregatedRatePerTon: entry.aggregatedRatePerTon,
        ticketNumber: entry.ticketNumber || undefined,
        fuelStationName: entry.fuelStationName || undefined,
      })),
    });

    setIsBatchModalOpen(false);
    const batchReferenceMonth = newEntries[0].referenceMonth || newEntries[0].operationDate.slice(0, 7);
    setSelectedReferenceMonth(batchReferenceMonth);
    setKnownReferenceMonths((current) => Array.from(new Set([batchReferenceMonth, ...current])));
  };

  const handleDeleteEntry = (entry: NovalogEntry) => {
    deleteEntry.mutate(entry.id);
  };

  const referenceMonthOptions = useMemo(() => {
    const months = new Set(knownReferenceMonths);
    (referenceMonthsQuery.data ?? []).forEach((month) => months.add(month));
    entries.forEach((entry) => months.add(entry.referenceMonth || entry.operationDate.slice(0, 7)));
    months.add(selectedReferenceMonth);

    return Array.from(months)
      .filter(Boolean)
      .sort((left, right) => right.localeCompare(left))
      .map((month) => ({
        value: month,
        label: formatReferenceMonthLabel(month),
      }));
  }, [entries, knownReferenceMonths, referenceMonthsQuery.data, selectedReferenceMonth]);

  const referenceMonthEntries = useMemo(
    () => entries,
    [entries],
  );

  const filteredEntries = useMemo(
    () =>
      referenceMonthEntries.filter((entry) => {
        return (
          matchesNovalogDisplayIdRange(entry.displayId, searchTerm) &&
          entry.originName.toLowerCase().includes(originFilter.toLowerCase()) &&
          entry.destinationName.toLowerCase().includes(destinationFilter.toLowerCase()) &&
          (entry.fuelStationName ?? '').toLowerCase().includes(fuelStationFilter.toLowerCase())
        );
      }),
    [destinationFilter, fuelStationFilter, originFilter, referenceMonthEntries, searchTerm],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReferenceMonth, searchTerm, originFilter, destinationFilter, fuelStationFilter, entries.length]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEntries = filteredEntries.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const originOptions = useMemo(() => {
    const optionMap = new Map<string, { value: string; label: string }>();

    (providersQuery.data ?? [])
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
      .forEach((provider) => {
        const normalized = provider.name.trim();
        if (!normalized) return;
        optionMap.set(normalized.toLocaleLowerCase('pt-BR'), {
          value: normalized,
          label: normalized,
        });
      });

    return Array.from(optionMap.values()).sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  }, [providersQuery.data]);

  const destinationOptions = useMemo(() => {
    const optionMap = new Map<string, { value: string; label: string }>();

    (companiesQuery.data ?? [])
      .slice()
      .sort((left, right) => {
        const leftName = left.tradeName || left.corporateName;
        const rightName = right.tradeName || right.corporateName;
        return leftName.localeCompare(rightName, 'pt-BR');
      })
      .forEach((company) => {
        const normalized = (company.tradeName || company.corporateName).trim();
        if (!normalized) return;
        optionMap.set(normalized.toLocaleLowerCase('pt-BR'), {
          value: normalized,
          label: normalized,
        });
      });

    return Array.from(optionMap.values()).sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  }, [companiesQuery.data]);

  const dynamicKpis = useMemo(() => {
    const totalWeight = filteredEntries.reduce((sum, entry) => sum + entry.weight, 0);
    const totalCompanyGross = filteredEntries.reduce((sum, entry) => sum + entry.companyGrossAmount, 0);
    const totalAggregatedGross = filteredEntries.reduce((sum, entry) => sum + entry.aggregatedGrossAmount, 0);

    return novalogInitialKpis.map((kpi) => {
      switch (kpi.label) {
        case 'Peso total':
          return {
            ...kpi,
            value: `${totalWeight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`,
            helperText: 'Soma dos pesos exibidos nos filtros atuais',
          };
        case 'Total empresa':
          return {
            ...kpi,
            value: formatNovalogCurrency(totalCompanyGross),
            helperText: 'Calculado pela tabela de operacoes da semana',
          };
        case 'Total terceiro':
          return {
            ...kpi,
            value: formatNovalogCurrency(totalAggregatedGross),
            helperText: 'Base financeira dos lancamentos filtrados',
          };
        default:
          return kpi;
      }
    });
  }, [filteredEntries]);

  if (!canAccessNovalogModule) {
    return (
      <div className="rounded-[2rem] border border-error/15 bg-error/5 px-6 py-5 text-sm font-medium text-error">
        Este modulo esta disponivel apenas para a operacao Novalog e para usuarios de desenvolvimento.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            <Pickaxe className="h-3.5 w-3.5" />
            Operacao
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface sm:text-[2.45rem]">
              Operacao Novalog
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-[15px]">
              Lance operacoes semanais por mineradora com uma experiencia preparada para entrada padrao e por lote.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/25 hover:bg-primary/5"
          >
            <Layers3 className="h-4 w-4 text-primary" />
            Novo lote
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95"
          >
            <PackagePlus className="h-4 w-4" />
            Novo lancamento
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dynamicKpis.map((kpi) => {
          const Icon = novalogKpiIcons[kpi.iconName];
          return <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} helperText={kpi.helperText} icon={Icon} />;
        })}
      </div>

      <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Competencia atual</p>
            <h2 className="mt-2 text-xl font-black capitalize text-on-surface">{formatReferenceMonthLabel(selectedReferenceMonth)}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Acompanhe os lancamentos pela competencia da data operacional.</p>
          </div>
          <div className="w-full max-w-[280px]">
            <CustomSelect
              value={selectedReferenceMonth}
              onChange={setSelectedReferenceMonth}
              options={referenceMonthOptions}
              placeholder="Competencia"
              buttonClassName="rounded-full bg-surface px-5 py-3 font-bold"
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[2rem] border border-error/15 bg-error/5 px-6 py-5 text-sm font-medium text-error">
          Nao foi possivel carregar os lancamentos Novalog agora.
        </div>
      ) : isLoading ? (
        <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest px-6 py-10 text-center text-sm text-on-surface-variant shadow-sm">
          Carregando lancamentos Novalog...
        </div>
      ) : mutationError ? (
        <div className="rounded-[2rem] border border-error/15 bg-error/5 px-6 py-5 text-sm font-medium text-error">
          Nao foi possivel salvar a ultima alteracao do modulo Novalog.
        </div>
      ) : (
        <NovalogEntriesTable
          entries={paginatedEntries}
          searchTerm={searchTerm}
          originFilter={originFilter}
          destinationFilter={destinationFilter}
          fuelStationFilter={fuelStationFilter}
          filteredCount={filteredEntries.length}
          totalCount={referenceMonthEntries.length}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onSearchChange={setSearchTerm}
          onOriginFilterChange={setOriginFilter}
          onDestinationFilterChange={setDestinationFilter}
          onFuelStationFilterChange={setFuelStationFilter}
          onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          onEdit={openEditModal}
          onDelete={handleDeleteEntry}
        />
      )}

      <NovalogStandardEntryModal
        isOpen={isStandardModalOpen}
        originOptions={originOptions}
        destinationOptions={destinationOptions}
        draftEntry={draftEntry}
        mode={standardModalMode}
        isSubmitting={isSubmitting}
        onClose={closeStandardModal}
        onSubmit={handleStandardSubmit}
      />

      <NovalogBatchEntryModal
        isOpen={isBatchModalOpen}
        originOptions={originOptions}
        destinationOptions={destinationOptions}
        isSubmitting={isSubmitting}
        onClose={() => setIsBatchModalOpen(false)}
        onSubmit={handleBatchSubmit}
      />
    </div>
  );
}
