import React from 'react';
import FormDatePicker from '../../../shared/forms/FormDatePicker';

interface NovalogDateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export default function NovalogDateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: NovalogDateRangeFilterProps) {
  return (
    <div className="flex h-[3rem] w-[18rem] shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-2 ring-1 ring-primary/5">
      <FormDatePicker
        label="Data inicial"
        value={from}
        onChange={onFromChange}
        required={false}
        showLabel={false}
        placeholder="De"
        containerClassName="min-w-0 flex-1 space-y-0"
        buttonClassName="border-0 bg-transparent px-0 py-0 text-sm shadow-none ring-0 focus:ring-0"
      />
      <span className="shrink-0 text-xs font-black text-on-surface">ate</span>
      <FormDatePicker
        label="Data final"
        value={to}
        onChange={onToChange}
        required={false}
        min={from || undefined}
        showLabel={false}
        placeholder="Ate"
        containerClassName="min-w-0 flex-1 space-y-0"
        buttonClassName="border-0 bg-transparent px-0 py-0 text-sm shadow-none ring-0 focus:ring-0"
      />
    </div>
  );
}
