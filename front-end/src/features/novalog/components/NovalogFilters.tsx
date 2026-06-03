import React from 'react';
import { Filter, Search, UserRound } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Input from '../../../shared/ui/Input';
import NovalogDateRangeFilter from './NovalogDateRangeFilter';

interface NovalogFiltersProps {
  searchTerm: string;
  referenceMonthFilter: string;
  referenceMonthOptions: Array<{ value: string; label: string }>;
  userFilter: string;
  userOptions: Array<{ value: string; label: string }>;
  ticketFilter: string;
  fuelStationFilter: string;
  operationDateFromFilter: string;
  operationDateToFilter: string;
  onSearchChange: (value: string) => void;
  onReferenceMonthFilterChange: (value: string) => void;
  onUserFilterChange: (value: string) => void;
  onTicketFilterChange: (value: string) => void;
  onFuelStationFilterChange: (value: string) => void;
  onOperationDateFromFilterChange: (value: string) => void;
  onOperationDateToFilterChange: (value: string) => void;
}

export default function NovalogFilters({
  searchTerm,
  referenceMonthFilter,
  referenceMonthOptions,
  userFilter,
  userOptions,
  ticketFilter,
  fuelStationFilter,
  operationDateFromFilter,
  operationDateToFilter,
  onSearchChange,
  onReferenceMonthFilterChange,
  onUserFilterChange,
  onTicketFilterChange,
  onFuelStationFilterChange,
  onOperationDateFromFilterChange,
  onOperationDateToFilterChange,
}: NovalogFiltersProps) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 xl:gap-3">
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ID"
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="w-[8.5rem] shrink-0"
          className="text-sm"
        />
        <Input
          value={ticketFilter}
          onChange={(event) => onTicketFilterChange(event.target.value)}
          placeholder="Ticket"
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="w-[9rem] shrink-0"
          className="text-sm"
        />
        <Input
          value={fuelStationFilter}
          onChange={(event) => onFuelStationFilterChange(event.target.value)}
          placeholder="Posto"
          leftIcon={<Filter className="h-4 w-4" />}
          containerClassName="w-[9rem] shrink-0"
          className="text-sm"
        />
        <NovalogDateRangeFilter
          from={operationDateFromFilter}
          to={operationDateToFilter}
          onFromChange={onOperationDateFromFilterChange}
          onToChange={onOperationDateToFilterChange}
        />
        <div className="flex h-[3rem] w-[11rem] shrink-0 items-center gap-2 rounded-2xl bg-surface px-3 py-2 ring-1 ring-primary/5">
          <UserRound className="h-4 w-4 shrink-0 text-primary" />
          <CustomSelect
            value={userFilter}
            onChange={onUserFilterChange}
            options={userOptions}
            variant="inline"
            placeholder="Usuario"
            menuClassName="w-[18rem]"
          />
        </div>
        <div className="flex h-[3rem] w-[11.5rem] shrink-0 items-center gap-2 rounded-2xl bg-surface px-3 py-2 ring-1 ring-primary/5">
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
