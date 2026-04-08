import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AccessPendingPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-lg w-full bg-surface-container-lowest p-10 rounded-[3rem] shadow-2xl border border-outline-variant">
        <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tight text-center">Acesso pendente</h1>
        <p className="text-on-surface-variant leading-relaxed text-center">
          Sua conta foi autenticada, mas ainda nao possui vinculacao com uma transportadora ativa.
          Solicite acesso ao administrador da plataforma ou ao owner da sua empresa.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => void logout()}
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
