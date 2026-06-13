import React from 'react';
import { Filter, Search } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

interface InventoryFiltersProps {
  searchTerm: string;
  stockFilter: string;
  categoryOptions: string[];
  categoryFilter: string;
  onSearchChange: (value: string) => void;
  onStockChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function InventoryFilters({
  searchTerm,
  stockFilter,
  categoryOptions,
  categoryFilter,
  onSearchChange,
  onStockChange,
  onCategoryChange,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-1 flex-col md:flex-row gap-4">
      <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
        <Search className="w-5 h-5 text-outline ml-3" />
        <input
          type="text"
          placeholder="Buscar por codigo ou descricao da peca..."
          className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="h-6 w-px bg-outline/20 mx-2" />
        <div className="flex items-center gap-2 px-2">
          <CustomSelect
            value={categoryFilter}
            onChange={onCategoryChange}
            variant="inline"
            options={[
              { value: 'all', label: 'Todas as categorias' },
              ...categoryOptions.map((category) => ({ value: category, label: category })),
            ]}
          />
          <div className="h-6 w-px bg-outline/20 mx-2" />
          <CustomSelect
            value={stockFilter}
            onChange={onStockChange}
            variant="inline"
            options={[
              { value: 'all', label: 'Todo o estoque' },
              { value: 'below', label: 'Abaixo do minimo' },
              { value: 'zero', label: 'Sem saldo' },
            ]}
          />
          <Filter className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
