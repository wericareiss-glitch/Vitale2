import React, { useState } from 'react';
import { Sparkles, Clock, Plus, Check } from 'lucide-react';
import { Procedure } from '../types';
import { PROCEDURES } from '../data/procedures';

interface ProceduresCatalogProps {
  onSelectProcedure: (procedure: Procedure) => void;
  onAddToCart: (procedure: Procedure) => void;
  cartItemIds: string[];
}

export const ProceduresCatalog: React.FC<ProceduresCatalogProps> = ({
  onSelectProcedure,
  onAddToCart,
  cartItemIds,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  const filtered = activeCategory === 'todos' 
    ? PROCEDURES 
    : PROCEDURES.filter(p => p.category === activeCategory);

  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <main id="procedimentos" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
      
      {/* Header and Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Protocolos de Alta Performance a Domicílio em Teresina
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">
            Cardápio de Procedimentos Exclusivos
          </h2>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos os Procedimentos' },
            { id: 'injetaveis', label: 'Injetáveis & Enzimas' },
            { id: 'facial', label: 'Facial & Renovação Cutânea' },
            { id: 'corporal', label: 'Corporal & Drenagem' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === tab.id
                  ? 'bg-gold-500 text-onyx-950 shadow-md font-bold'
                  : 'bg-onyx-850 hover:bg-onyx-800 text-neutral-300 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Procedures Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(proc => {
          const isConsulta = proc.id === 'consulta-avaliacao';
          const isInCart = cartItemIds.includes(proc.id);

          return (
            <div
              key={proc.id}
              className="group relative rounded-2xl bg-onyx-900 border border-white/5 hover:border-gold-500/40 p-4 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1"
            >
              <div>
                {/* Image */}
                <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-onyx-850">
                  <img
                    src={proc.image}
                    alt={proc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-onyx-950/80 backdrop-blur-md text-gold-400 border border-gold-500/30">
                    Domicílio em THE
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/70 backdrop-blur-sm text-neutral-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gold-400" /> {proc.duration}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif text-lg font-medium text-white mb-1.5 leading-snug line-clamp-2">
                  {proc.name}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
                  {proc.description}
                </p>
              </div>

              {/* Price & Actions */}
              <div className="pt-3 border-t border-white/5">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                      Valor da Sessão
                    </span>
                    <span className="text-lg font-bold text-gold-400 font-sans">
                      {formatCurrency(proc.price)}
                    </span>
                  </div>
                  {isConsulta ? (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                      Cortesia c/ outro serviço
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      Kit estéril incluso
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectProcedure(proc)}
                    className="py-2 px-3 rounded-xl bg-onyx-850 hover:bg-onyx-800 text-neutral-300 hover:text-white text-xs font-semibold border border-white/5 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => onAddToCart(proc)}
                    className="py-2 px-3 rounded-xl gold-gradient-bg text-onyx-950 hover:brightness-110 active:scale-95 text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {isInCart ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Adicionado
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Agendar THE
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </main>
  );
};
