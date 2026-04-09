import { useEffect, useMemo, useRef } from 'react';

type FieldErrors = Record<string, string | undefined>;

interface UseFormErrorFocusOptions {
  enabled?: boolean;
  fieldErrors?: FieldErrors;
  message?: string;
}

export function useFormErrorFocus({
  enabled = true,
  fieldErrors = {},
  message,
}: UseFormErrorFocusOptions) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);

  const errorSignature = useMemo(
    () =>
      Object.entries(fieldErrors)
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => `${key}:${value}`)
        .join('|'),
    [fieldErrors],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    if (!errorSignature && !message) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const firstInvalidField =
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      const target = firstInvalidField ?? alertRef.current;

      if (!target) return;

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      if (firstInvalidField instanceof HTMLElement) {
        firstInvalidField.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [enabled, errorSignature, message]);

  return {
    formRef,
    alertRef,
  };
}

export default useFormErrorFocus;
