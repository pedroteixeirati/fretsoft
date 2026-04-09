import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldErrorProps {
  message?: string;
}

export default function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) return null;

  return (
    <p className="flex items-start gap-2 pl-1 text-xs font-medium leading-5 text-error">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
