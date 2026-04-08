import React, { useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Ocorreu um erro na autenticacao.';
      if (error.code === 'auth/user-not-found') message = 'Usuario nao encontrado.';
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      if (error.code === 'auth/email-already-in-use') message = 'Este e-mail ja esta em uso.';
      if (error.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      if (error.code === 'auth/invalid-email') message = 'E-mail invalido.';
      if (error.code === 'auth/operation-not-allowed') message = 'O login por E-mail/Senha nao esta ativado no Console do Firebase.';
      setAuthError(message);
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
            <p className="mt-2 text-[13px] uppercase tracking-[0.22em] text-on-surface-variant">GESTAO MODERNA PARA FROTAS</p>
          </div>

          <form onSubmit={handleAuth} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="block pl-1 text-xs font-medium uppercase tracking-[0.18em] text-on-surface">Email</label>
              <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-inner shadow-primary/5 ring-1 ring-primary/5">
                <Mail className="h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-transparent text-lg text-on-surface placeholder:text-on-surface-variant/65 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label className="block pl-1 text-xs font-medium uppercase tracking-[0.18em] text-on-surface">Senha</label>
                <span className="text-sm font-bold text-primary">Esqueceu?</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-inner shadow-primary/5 ring-1 ring-primary/5">
                <Lock className="h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-lg text-on-surface placeholder:text-on-surface-variant/65 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authError && (
              <div className="rounded-2xl border border-error/20 bg-error/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-error">Erro de autenticacao</p>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{authError}</p>
                {authError.includes('Console do Firebase') && (
                  <p className="mt-2 text-xs italic text-on-surface-variant">
                    Acesse: Console {' > '} Authentication {' > '} Sign-in method {' > '} Ativar E-mail/Senha.
                  </p>
                )}
              </div>
            )}

            <button
              disabled={isSubmitting}
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
