import React, { useMemo, useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { FormAlert, FormFieldError, useFormErrorFocus } from '../../../shared/forms';
import { FormFieldErrors } from '../../../lib/errors';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, LoginFormValues } from '../validations/login.schema';

type LoginField = keyof LoginFormValues;

const firebaseErrorMap: Record<string, { message: string; field?: LoginField }> = {
  'auth/invalid-email': {
    message: 'Informe um e-mail valido.',
    field: 'email',
  },
  'auth/user-not-found': {
    message: 'Nao encontramos uma conta com este e-mail.',
  },
  'auth/wrong-password': {
    message: 'E-mail ou senha incorretos.',
  },
  'auth/invalid-credential': {
    message: 'E-mail ou senha incorretos.',
  },
  'auth/user-disabled': {
    message: 'Este acesso foi desativado. Fale com o suporte.',
  },
  'auth/too-many-requests': {
    message: 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.',
  },
  'auth/network-request-failed': {
    message: 'Nao foi possivel conectar. Verifique sua internet e tente novamente.',
  },
  'auth/operation-not-allowed': {
    message: 'O login por e-mail e senha nao esta habilitado.',
  },
};

function resolveLoginError(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';

  return (
    firebaseErrorMap[code] ?? {
      message: 'Nao foi possivel entrar agora. Tente novamente em instantes.',
    }
  );
}

interface AuthInputProps {
  label: string;
  type: 'email' | 'password';
  placeholder: string;
  value: string;
  icon: React.ElementType;
  error?: string;
  trailingContent?: React.ReactNode;
  onChange: (value: string) => void;
}

function AuthInput({
  label,
  type,
  placeholder,
  value,
  icon: Icon,
  error,
  trailingContent,
  onChange,
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label className="block pl-1 text-xs font-medium uppercase tracking-[0.18em] text-on-surface">
          {label}
        </label>
        {trailingContent}
      </div>

      <div
        className={`flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-inner shadow-primary/5 ring-1 transition-all ${
          error
            ? 'ring-error/35 focus-within:ring-2 focus-within:ring-error/20'
            : 'ring-primary/5 focus-within:ring-2 focus-within:ring-primary/20'
        }`}
      >
        <Icon className="h-4.5 w-4.5 text-on-surface-variant" />
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-lg text-on-surface placeholder:text-on-surface-variant/65 outline-none"
          aria-invalid={Boolean(error)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>

      <FormFieldError message={error} />
    </div>
  );
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<LoginField>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formRef, alertRef } = useFormErrorFocus({
    fieldErrors,
    message: authError,
  });

  const hasFieldErrors = useMemo(
    () => Object.values(fieldErrors).some(Boolean),
    [fieldErrors],
  );

  const formMessage =
    authError || (hasFieldErrors ? 'Revise os campos destacados antes de entrar.' : '');
  const isLoginReady = email.trim().length > 0 && password.trim().length > 0;

  const clearFieldError = (field: LoginField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      return {
        ...current,
        [field]: undefined,
      };
    });
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    setFieldErrors({});

    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      const nextFieldErrors: FormFieldErrors<LoginField> = {};

      for (const issue of validation.error.issues) {
        const field = issue.path[0] as LoginField | undefined;
        if (!field || nextFieldErrors[field]) continue;
        nextFieldErrors[field] = issue.message;
      }

      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Auth error:', error);

      const resolvedError = resolveLoginError(error);
      setAuthError(resolvedError.message);

      if (resolvedError.field) {
        setFieldErrors((current) => ({
          ...current,
          [resolvedError.field!]: resolvedError.message,
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-surface px-4 py-6 sm:px-6"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(82,102,0,0.08) 1px, transparent 0)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,237,127,0.18),transparent_40%)]" />

      <div className="relative flex min-h-screen items-center justify-center">
        <div className="w-full max-w-[24rem] rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest/90 px-7 py-8 shadow-[0_20px_64px_rgba(82,102,0,0.09)] backdrop-blur xl:px-8">
          <div className="flex justify-center">
            <img
              src="/fretsoft-login-icon.png"
              alt="Icone Fretsoft"
              className="h-16 w-16 object-contain drop-shadow-[0_14px_28px_rgba(82,102,0,0.18)]"
            />
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-black tracking-tight text-primary">Fretsoft</h1>
            <p className="mt-2 text-[13px] uppercase tracking-[0.22em] text-on-surface-variant">
              GESTAO MODERNA PARA FROTAS
            </p>
          </div>

          <form ref={formRef} noValidate onSubmit={handleAuth} className="mt-8 space-y-5">
            <div ref={alertRef}>
              <FormAlert message={formMessage} />
            </div>

            <AuthInput
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              icon={Mail}
              error={fieldErrors.email}
              onChange={(value) => {
                clearFieldError('email');
                setEmail(value);
              }}
            />

            <AuthInput
              label="Senha"
              type="password"
              placeholder="********"
              value={password}
              icon={Lock}
              error={fieldErrors.password}
              trailingContent={
                <span className="text-sm font-bold text-primary">Esqueceu?</span>
              }
              onChange={(value) => {
                clearFieldError('password');
                setPassword(value);
              }}
            />

            <button
              disabled={isSubmitting || !isLoginReady}
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-lg font-black text-on-primary shadow-[0_16px_26px_rgba(82,102,0,0.2)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Processando...' : 'Entrar no painel'}
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </form>

          <div className="mt-8 border-t border-outline-variant/15 pt-5 text-center">
            <p className="text-sm text-on-surface-variant">
              Nao possui acesso? <span className="font-black text-primary">Fale com o suporte</span>
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 text-xs uppercase tracking-[0.22em] text-on-surface-variant/75">
        <span>Powered by JPSOFT</span>
      </div>
    </div>
  );
}
