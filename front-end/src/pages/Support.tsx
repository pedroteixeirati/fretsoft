import React from 'react';
import { Search, MessageCircle, Phone, Mail, BookOpen, ChevronRight, HelpCircle, FileText, Zap, ExternalLink } from 'lucide-react';

export default function Support() {
  return (
    <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 p-8 duration-700">
      <header className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-black tracking-tight text-on-surface">Como podemos ajudar?</h1>
        <p className="mx-auto max-w-2xl text-lg text-on-surface-variant">
          Pesquise em nossa base de conhecimento ou entre em contato com nossa equipe de especialistas para assistencia personalizada.
        </p>

        <div className="relative mx-auto mt-10 max-w-2xl">
          <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Pesquisar artigos, guias ou solucao de problemas..."
            className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-5 pl-16 pr-8 text-lg shadow-xl shadow-primary/5 transition-all focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </header>

      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="flex flex-col items-center rounded-[2.5rem] border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-on-surface">Chat ao Vivo</h3>
          <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
            Converse com nossa equipe de suporte em tempo real para respostas rapidas.
          </p>
          <button className="w-full rounded-full bg-primary py-3 font-bold text-on-primary transition-transform hover:scale-[1.02]">
            Iniciar Chat
          </button>
        </div>

        <div className="flex flex-col items-center rounded-[2.5rem] border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/10 text-secondary">
            <Phone className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-on-surface">Suporte por Telefone</h3>
          <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
            Disponivel 24/7 para problemas urgentes de gestao de frota.
          </p>
          <button className="w-full rounded-full bg-secondary py-3 font-bold text-on-secondary transition-transform hover:scale-[1.02]">
            Ligar Agora
          </button>
        </div>

        <div className="flex flex-col items-center rounded-[2.5rem] border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-tertiary/10 text-tertiary">
            <Mail className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-on-surface">Envie um E-mail</h3>
          <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
            Envie-nos um ticket e responderemos em ate 24h.
          </p>
          <button className="w-full rounded-full bg-tertiary py-3 font-bold text-on-tertiary transition-transform hover:scale-[1.02]">
            Enviar E-mail
          </button>
        </div>
      </div>

      <section className="mb-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Artigos Populares</h2>
          <button className="flex items-center gap-1 font-bold text-primary hover:underline">
            Ver Toda a Documentacao
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { title: 'Primeiros passos com Fretsoft', icon: Zap, category: 'Inicio Rapido' },
            { title: 'Como exportar seus relatorios fiscais anuais', icon: FileText, category: 'Relatorios' },
            { title: 'Adicionando categorias de custos operacionais', icon: HelpCircle, category: 'Configuracao' },
            { title: 'Gerenciando permissoes multiusuario', icon: BookOpen, category: 'Seguranca' },
          ].map((article, i) => (
            <div
              key={i}
              className="group flex cursor-pointer items-center justify-between rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 transition-colors hover:bg-surface-container"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-on-surface/5 text-on-surface-variant transition-colors group-hover:text-primary">
                  <article.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{article.category}</p>
                  <h4 className="font-bold text-on-surface transition-transform group-hover:translate-x-1">{article.title}</h4>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[3rem] bg-primary-container p-12 text-on-primary-container shadow-2xl shadow-primary/20 md:flex-row">
        <div className="relative z-10 text-center md:text-left">
          <h2 className="mb-4 text-4xl font-black">Precisa de uma demonstracao personalizada?</h2>
          <p className="max-w-md text-lg leading-relaxed opacity-90">
            Nossos especialistas em frota podem ajudar voce a otimizar suas operacoes com um tour personalizado na plataforma.
          </p>
        </div>
        <button className="relative z-10 rounded-full bg-on-primary-container px-10 py-5 text-lg font-black text-primary-container shadow-xl transition-transform hover:scale-105">
          Agendar Demonstracao
        </button>
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-on-primary-container/10 blur-3xl" />
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-on-primary-container/10 blur-3xl" />
      </div>
    </div>
  );
}
