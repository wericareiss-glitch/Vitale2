import React from 'react';
import { X, Check, CalendarPlus } from 'lucide-react';
import { Procedure } from '../types';

interface ProcedureModalProps {
  procedure: Procedure | null;
  onClose: () => void;
  onAddToCart: (procedure: Procedure) => void;
}

export const ProcedureModal: React.FC<ProcedureModalProps> = ({
  procedure,
  onClose,
  onAddToCart,
}) => {
  if (!procedure) return null;

  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-onyx-900 border border-gold-500/30 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white w-8 h-8 rounded-full bg-onyx-850 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          <div className="relative h-52 rounded-xl overflow-hidden">
            <img
              src={procedure.image}
              alt={procedure.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-onyx-950 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-bold text-gold-400 bg-onyx-900/90 px-3 py-1 rounded-full border border-gold-500/30">
              ATENDIMENTO A DOMICÍLIO EM TERESINA
            </span>
          </div>

          <div>
            <h3 className="font-serif text-2xl text-white">{procedure.name}</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Duração média: <span className="text-neutral-200 font-semibold">{procedure.duration}</span> | Protocolo: <span className="text-neutral-200 font-semibold">{procedure.sessions}</span>
            </p>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            {procedure.description}
          </p>

          <div className="bg-onyx-850 p-4 rounded-xl border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-2">
              Diferenciais e Benefícios
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              {procedure.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div>
              <span className="text-xs text-neutral-400 block">Valor com Kit Domiciliar</span>
              <span className="text-2xl font-bold text-gold-400 font-sans">
                {formatCurrency(procedure.price)}
              </span>
            </div>
            <button
              onClick={() => {
                onAddToCart(procedure);
                onClose();
              }}
              className="py-3 px-6 rounded-xl gold-gradient-bg text-onyx-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" /> Agendar em Casa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
