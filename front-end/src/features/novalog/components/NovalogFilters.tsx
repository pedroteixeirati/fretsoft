import React from 'react';
import { Filter, Search } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import FormDatePicker from '../../../shared/forms/FormDatePicker';
import Input from '../../../shared/ui/Input';

interface NovalogFiltersProps {
  searchTerm: string;
  referenceMonthFilter: string;
  referenceMonthOptions: Array<{ value: string; label: string }>;
  ticketFilter: string;
  fuelStationFilter: string;
  operationDateFilter: string;
  onSearchChange: (value: string) => void;
  onReferenceMonthFilterChange: (value: string) => void;
  onTicketFilterChange: (value: string) => void;
  onFuelStationFilterChange: (value: string) => void;
  onOperationDateFilterChange: (value: string) => void;
}

export default function NovalogFilters({
  searchTerm,
  referenceMonthFilter,
  referenceMonthOptions,
  ticketFilter,
  fuelStationFilter,
  operationDateFilter,
  onSearchChange,
  onReferenceMonthFilterChange,
  onTicketFilterChange,
  onFuelStationFilterChange,
  onOperationDateFilterChange,
}: NovalogFiltersProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max flex-nowrap items-center gap-2 xl:min-w-0 xl:gap-3">
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ID"
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="w-[10rem] shrink-0"
          className="text-sm"
        />
        <Input
          value={ticketFilter}
          onChange={(event) => onTicketFilterChange(event.target.value)}
          placeholder="Ticket"
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="w-[10rem] shrink-0"
          className="text-sm"
        />
        <Input
          value={fuelStationFilter}
          onChange={(event) => onFuelStationFilterChange(event.target.value)}
          placeholder="Posto"
          leftIcon={<Filter className="h-4 w-4" />}
          containerClassName="w-[10rem] shrink-0"
          className="text-sm"
        />
        <FormDatePicker
          label="Data lancamento"
          value={operationDateFilter}
          onChange={onOperationDateFilterChange}
          required={false}
          showLabel={false}
          placeholder="Data"
          containerClassName="w-[11rem] shrink-0 space-y-0"
          buttonClassName="rounded-2xl border-0 px-3 py-3 ring-1 ring-primary/5 focus:ring-primary/20"
        />
        <div className="flex h-[3rem] w-[12rem] shrink-0 items-center gap-2 rounded-2xl bg-surface px-3 py-2 ring-1 ring-primary/5">
          <CustomSelect
            value={referenceMonthFilter}
            onChange={onReferenceMonthFilterChange}
            options={referenceMonthOptions}
            variant="inline"
            menuClassName="w-[18rem]"
          />
          <Filter className="h-4 w-4 shrink-0 text-primary" />
        </div>
      </div>
    </div>
  );
}
