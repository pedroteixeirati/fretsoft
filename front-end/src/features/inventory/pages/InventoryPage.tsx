import React, { useMemo, useState } from 'react';
import { AlertTriangle, Package, Wallet } from 'lucide-react';
import { getErrorMessage, resolveFieldError } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import { clearFieldError } from '../../../shared/forms';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import KpiCard from '../../../shared/ui/KpiCard';
import { useInventoryQuery } from '../hooks/useInventoryQuery';
import { useInventoryMovementsQuery } from '../hooks/useInventoryMovementsQuery';
import { useInventoryMutations } from '../hooks/useInventoryMutations';
import { useInventoryItemForm, useInventoryMovementForm } from '../hooks/useInventoryForms';
import InventoryHeader from '../components/InventoryHeader';
import InventoryFilters from '../components/InventoryFilters';
import InventoryList from '../components/InventoryList';
import InventoryItemFormModal from '../components/InventoryItemFormModal';
import InventoryMovementModal from '../components/InventoryMovementModal';
import InventoryHistoryModal from '../components/InventoryHistoryModal';
import { InventoryItem, InventoryMovementType } from '../types/inventory.types';

function parseNumber(value: string) {
  const numeric = Number(String(value).replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function InventoryPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'inventory', 'create');
  const canUpdate = canAccess(userProfile, 'inventory', 'update');
  const canDelete = canAccess(userProfile, 'inventory', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const { items, isLoading: loading, error: loadQueryError } = useInventoryQuery({ enabled: Boolean(userProfile) });
  const { createItem, updateItem, deleteItem, registerMovement, isSubmitting } = useInventoryMutations();
  const { movements, isLoading: movementsLoading } = useInventoryMovementsQuery(historyItem?.id ?? null);

  const itemForm = useInventoryItemForm();
  const movementForm = useInventoryMovementForm();

  const loadError = loadQueryError ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar o almoxarifado.') : '';

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !search || item.name.toLowerCase().includes(search) || item.code.toLowerCase().includes(search);
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'below' && item.belowMinimum) ||
          (stockFilter === 'zero' && item.quantity <= 0);
        return matchesSearch && matchesCategory && matchesStock;
      }),
    [items, searchTerm, categoryFilter, stockFilter],
  );

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const belowMinimum = items.filter((item) => item.belowMinimum).length;
    return { totalValue, belowMinimum, itemCount: items.length };
  }, [items]);

  const handleItemSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    itemForm.setSubmitError('');
    itemForm.setFieldErrors({});

    const data = itemForm.formData;
    const nextFieldErrors: typeof itemForm.fieldErrors = {};

    if (data.name.trim().length < 2) nextFieldErrors.name = 'Informe o nome da peca.';
    if (data.unitCost.trim() !== '' && (!Number.isFinite(Number(data.unitCost)) || Number(data.unitCost) < 0)) {
      nextFieldErrors.unitCost = 'O valor unitario deve ser zero ou maior.';
    }
    if (!itemForm.editingItem && data.quantity.trim() !== '' && (!Number.isFinite(Number(data.quantity)) || Number(data.quantity) < 0)) {
      nextFieldErrors.quantity = 'O saldo inicial deve ser zero ou maior.';
    }
    if (data.minQuantity.trim() !== '' && (!Number.isFinite(Number(data.minQuantity)) || Number(data.minQuantity) < 0)) {
      nextFieldErrors.minQuantity = 'O estoque minimo deve ser zero ou maior.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      itemForm.setFieldErrors(nextFieldErrors);
      return;
    }

    const payload = {
      code: data.code.trim(),
      name: data.name.trim(),
      category: data.category.trim(),
      unitCost: data.unitCost.trim() === '' ? 0 : Number(data.unitCost),
      minQuantity: data.minQuantity.trim() === '' ? null : Number(data.minQuantity),
      notes: data.notes.trim(),
      ...(itemForm.editingItem ? {} : { quantity: data.quantity.trim() === '' ? 0 : Number(data.quantity) }),
    };

    try {
      if (itemForm.editingItem) {
        await updateItem.mutateAsync({ id: itemForm.editingItem.id, payload });
        setFeedback({ message: 'Peca atualizada com sucesso.', isError: false });
      } else {
        await createItem.mutateAsync(payload);
        setFeedback({ message: 'Peca cadastrada com sucesso.', isError: false });
      }
      itemForm.close();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: { code: 'code', name: 'name', category: 'category', unitCost: 'unitCost', quantity: 'quantity', minQuantity: 'minQuantity' },
      });
      if (fieldError?.field) {
        itemForm.setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }
      itemForm.setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a peca.'));
    }
  };

  const handleMovementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    movementForm.setSubmitError('');
    movementForm.setFieldErrors({});

    if (!movementForm.targetItem) return;

    const data = movementForm.formData;
    const nextFieldErrors: typeof movementForm.fieldErrors = {};

    if (parseNumber(data.quantity) <= 0) nextFieldErrors.quantity = 'A quantidade deve ser maior que zero.';
    if (!isValidDateInput(data.occurredOn)) nextFieldErrors.occurredOn = 'Informe a data da movimentacao.';
    if (data.unitCost.trim() !== '' && (!Number.isFinite(Number(data.unitCost)) || Number(data.unitCost) < 0)) {
      nextFieldErrors.unitCost = 'O valor unitario deve ser zero ou maior.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      movementForm.setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      await registerMovement.mutateAsync({
        inventoryItemId: movementForm.targetItem.id,
        movementType: data.movementType,
        quantity: parseNumber(data.quantity),
        unitCost: data.unitCost.trim() === '' ? null : Number(data.unitCost),
        occurredOn: data.occurredOn,
        reason: data.reason.trim(),
        notes: data.notes.trim(),
      });
      setFeedback({
        message: data.movementType === 'in' ? 'Entrada registrada com sucesso.' : 'Saida registrada com sucesso.',
        isError: false,
      });
      movementForm.close();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: { quantity: 'quantity', occurredOn: 'occurredOn', unitCost: 'unitCost' },
      });
      if (fieldError?.field) {
        movementForm.setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }
      movementForm.setSubmitError(getErrorMessage(error, 'Nao foi possivel registrar a movimentacao.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem.mutateAsync(deletingItem.id);
      setFeedback({ message: 'Peca excluida com sucesso.', isError: false });
      setDeletingItem(null);
    } catch (error) {
      setDeletingItem(null);
      setFeedback({ message: getErrorMessage(error, 'Nao foi possivel excluir a peca.'), isError: true });
    }
  };

  const openMovement = (item: InventoryItem, movementType: InventoryMovementType) => {
    setFeedback(null);
    movementForm.open(item, movementType);
  };

  const feedbackMessage = feedback?.message || loadError;
  const feedbackIsError = feedback ? feedback.isError : Boolean(loadError);

  return (
    <div className="space-y-10">
      <InventoryHeader canCreate={canCreate} onCreate={() => { setFeedback(null); itemForm.openCreate(); }} />

      {feedbackMessage ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            feedbackIsError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'
          }`}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Valor em estoque" value={formatCurrency(stats.totalValue)} icon={Wallet} tone="primary" />
        <KpiCard label="Pecas cadastradas" value={stats.itemCount} icon={Package} tone="secondary" />
        <KpiCard label="Abaixo do minimo" value={stats.belowMinimum} icon={AlertTriangle} tone={stats.belowMinimum > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <InventoryFilters
            searchTerm={searchTerm}
            stockFilter={stockFilter}
            categoryOptions={categoryOptions}
            categoryFilter={categoryFilter}
            onSearchChange={setSearchTerm}
            onStockChange={setStockFilter}
            onCategoryChange={setCategoryFilter}
          />
        </div>

        <InventoryList
          items={filteredItems}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEntry={(item) => openMovement(item, 'in')}
          onExit={(item) => openMovement(item, 'out')}
          onHistory={(item) => { setFeedback(null); setHistoryItem(item); }}
          onEdit={(item) => { setFeedback(null); itemForm.openEdit(item); }}
          onDelete={(item) => { setFeedback(null); setDeletingItem(item); }}
        />
      </div>

      <InventoryItemFormModal
        isOpen={itemForm.isOpen}
        editing={Boolean(itemForm.editingItem)}
        submitError={itemForm.submitError}
        fieldErrors={itemForm.fieldErrors}
        isSubmitting={isSubmitting}
        formData={itemForm.formData}
        onClose={itemForm.close}
        onSubmit={handleItemSubmit}
        onChange={itemForm.setFormData}
        onClearFieldError={(field) => itemForm.setFieldErrors((current) => clearFieldError(current, field))}
      />

      <InventoryMovementModal
        isOpen={movementForm.isOpen}
        item={movementForm.targetItem}
        submitError={movementForm.submitError}
        fieldErrors={movementForm.fieldErrors}
        isSubmitting={registerMovement.isPending}
        formData={movementForm.formData}
        onClose={movementForm.close}
        onSubmit={handleMovementSubmit}
        onChange={movementForm.setFormData}
        onClearFieldError={(field) => movementForm.setFieldErrors((current) => clearFieldError(current, field))}
      />

      <InventoryHistoryModal
        isOpen={Boolean(historyItem)}
        item={historyItem}
        movements={movements}
        loading={movementsLoading}
        onClose={() => setHistoryItem(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Excluir peca"
        message={
          deletingItem
            ? `Tem certeza que deseja excluir "${deletingItem.name}"? O historico de movimentacoes desta peca tambem sera removido.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteItem.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
