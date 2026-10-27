import React from 'react';
import { Sparkles, ShoppingBag, ShieldCheck, Zap, Layers } from 'lucide-react';
import { MercadoPagoConfig } from '../types';
import { NotificationsPopover } from './NotificationsPopover';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  ordersCount: number;
  mpConfig: MercadoPagoConfig;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenMpSettings: () => void;
  onSelectOrder: (orderId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  ordersCount,
  mpConfig,
  onOpenCart,
  onOpenOrders,
  onOpenMpSettings,
  onSelectOrder,
}) => {
  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <>
      {/* Top Banner Teresina */}
      <div className="bg-gradient-to-r from-onyx-900 via-onyx-850 to-onyx-900 border-b border-gold-500/25 py-2 px-4 text-center text-xs tracking-wider text-neutral-300">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-block w-2 h-2 rounded-full bg-gold-400 animate-ping" />
          <span className="text-gold-400 font-bold uppercase tracking-widest text-[11px]">
            Exclusivo em Teresina - PI:
          </span>
          Atendimento domiciliar em toda a capital • Pagamento seguro via Mercado Pago (PIX e Cartão até 12x)
        </span>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-onyx-950/90 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border border-gold-500/40 flex items-center justify-center bg-onyx-900 group-hover:border-gold-400 transition-colors shadow-lg">
              <Sparkles className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <span className="font-serif text-2xl tracking-[0.2em] font-bold text-white block leading-none">
                VITALE
              </span>
              <span className="text-[9px] tracking-[0.25em] text-gold-400 font-medium uppercase">
                Concierge • Teresina - PI
              </span>
            </div>
          </a>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs text-neutral-300 font-medium">
            <a href="#procedimentos" className="hover:text-gold-400 transition-colors">
              Procedimentos
            </a>
            <a href="#cobertura-teresina" className="hover:text-gold-400 transition-colors">
              Bairros Atendidos
            </a>
            <a href="#como-funciona" className="hover:text-gold-400 transition-colors">
              Como Funciona
            </a>
            <a href="#faq" className="hover:text-gold-400 transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Actions: Mercado Pago pill + Orders + Notifications + Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mercado Pago Status Pill */}
            <button
              onClick={onOpenMpSettings}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-onyx-850 hover:bg-onyx-800 border border-white/10 text-neutral-300 hover:text-white transition-all group"
              title="Configurações do Mercado Pago"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#009EE3]" />
              <span className="text-white font-bold">Mercado Pago:</span>
              <span className={mpConfig.configured ? 'text-emerald-400 font-medium' : 'text-gold-400 font-medium'}>
                {mpConfig.mode === 'production' ? 'Produção' : mpConfig.mode === 'sandbox' ? 'Sandbox' : 'Ativo'}
              </span>
            </button>

            {/* Notification Bell */}
            <NotificationsPopover onSelectOrder={onSelectOrder} />

            {/* Orders Management Button */}
            <button
              onClick={onOpenOrders}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-onyx-850 hover:bg-onyx-800 border border-white/10 hover:border-gold-500/40 text-neutral-300 hover:text-white transition-all text-xs font-semibold"
            >
              <Layers className="w-4 h-4 text-gold-400" />
              <span className="hidden md:inline">Pedidos</span>
              {ordersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-onyx-950 text-gold-400 border border-gold-500/30 text-[10px] font-bold flex items-center justify-center">
                  {ordersCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full gold-gradient-bg text-onyx-950 font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-onyx-950 text-gold-400 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-gold-400">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                Agendamento
              </span>
              <span className="text-xs font-black">
                {formatCurrency(cartTotal)}
              </span>
            </button>

          </div>

        </div>
      </header>
    </>
  );
};
