import React from 'react';
import { Search, MessageCircle, Phone, Mail, BookOpen, ChevronRight, HelpCircle, FileText, Zap, ExternalLink } from 'lucide-react';

export default function Support() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-black text-on-surface tracking-tight mb-4">Como podemos ajudar?</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">Pesquise em nossa base de conhecimento ou entre em contato com nossa equipe de especialistas para assistência personalizada.</p>
        
        <div className="relative max-w-2xl mx-auto mt-10">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Pesquisar artigos, guias ou solução de problemas..." 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-5 pl-16 pr-8 text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-xl shadow-primary/5 transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Chat ao Vivo</h3>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Converse com nossa equipe de suporte em tempo real para respostas rápidas.</p>
          <button className="w-full bg-primary text-on-primary py-3 rounded-full font-bold hover:scale-[1.02] transition-transform">Iniciar Chat</button>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary mb-6">
            <Phone className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Suporte por Telefone</h3>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Disponível 24/7 para problemas urgentes de gestão de frota.</p>
          <button className="w-full bg-secondary text-on-secondary py-3 rounded-full font-bold hover:scale-[1.02] transition-transform">Ligar Agora</button>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-tertiary/10 rounded-3xl flex items-center justify-center text-tertiary mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Envie um E-mail</h3>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Envie-nos um ticket e responderemos em até 24h.</p>
          <button className="w-full bg-tertiary text-on-tertiary py-3 rounded-full font-bold hover:scale-[1.02] transition-transform">Enviar E-mail</button>
        </div>
      </div>

      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-on-surface tracking-tight">Artigos Populares</h2>
          <button className="text-primary font-bold flex items-center gap-1 hover:underline">
            Ver Toda a Documentação
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Primeiros passos com Nova Log", icon: Zap, category: "Início Rápido" },
            { title: "Como exportar seus relatórios fiscais anuais", icon: FileText, category: "Relatórios" },
            { title: "Adicionando categorias de despesas personalizadas", icon: HelpCircle, category: "Configuração" },
            { title: "Gerenciando permissões multiusuário", icon: BookOpen, category: "Segurança" },
          ].map((article, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-on-surface/5 rounded-2xl flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                  <article.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{article.category}</p>
                  <h4 className="font-bold text-on-surface group-hover:translate-x-1 transition-transform">{article.title}</h4>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

      <div className="bg-primary-container p-12 rounded-[3rem] text-on-primary-container relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary/20">
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-4xl font-black mb-4">Precisa de uma demonstração personalizada?</h2>
          <p className="text-lg opacity-90 max-w-md leading-relaxed">Nossos especialistas em frota podem ajudar você a otimizar suas operações com um tour personalizado em nossa plataforma.</p>
        </div>
        <button className="relative z-10 bg-on-primary-container text-primary-container px-10 py-5 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl">
          Agendar Demonstração
        </button>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-on-primary-container/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-on-primary-container/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
