import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import { VehicleFormData } from '../hooks/useVehicleForm';

interface VehicleFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  isSubmitting: boolean;
  formData: VehicleFormData;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: VehicleFormData) => void;
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input
        required
        type={type}
        min={type === 'number' ? 0 : undefined}
        className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default function VehicleFormModal({
  isOpen,
  editing,
  submitError,
  isSubmitting,
  formData,
  onClose,
  onSubmit,
  onChange,
}: VehicleFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar veiculo' : 'Novo veiculo'}>
      <form onSubmit={onSubmit} className="space-y-6">
        {submitError ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
            {submitError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nome do veiculo"
            value={formData.name}
            onChange={(value) => onChange({ ...formData, name: value })}
            placeholder="Ex: Volvo FH 540"
          />
          <Input
            label="Placa"
            value={formData.plate}
            onChange={(value) => onChange({ ...formData, plate: value.toUpperCase() })}
            placeholder="ABC-1234"
          />
          <Input
            label="Motorista"
            value={formData.driver}
            onChange={(value) => onChange({ ...formData, driver: value })}
            placeholder="Nome do motorista"
          />
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</label>
            <CustomSelect
              value={formData.type}
              onChange={(value) => onChange({ ...formData, type: value })}
              options={['Carga Pesada', 'Longo Percurso', 'Utilitario', 'Executivo'].map((option) => ({
                value: option,
                label: option,
              }))}
            />
          </div>
          <Input
            label="Quilometragem"
            type="number"
            value={String(formData.km)}
            onChange={(value) => onChange({ ...formData, km: Number(value) })}
          />
          <Input
            label="Proxima manutencao"
            type="date"
            value={formData.nextMaintenance}
            onChange={(value) => onChange({ ...formData, nextMaintenance: value })}
          />
        </div>

        <div className="pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={isSubmitting}
            type="submit"
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {editing ? 'Salvar alteracoes' : 'Cadastrar veiculo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
