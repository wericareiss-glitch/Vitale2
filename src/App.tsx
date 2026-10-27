import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProceduresCatalog } from './components/ProceduresCatalog';
import { CoverageSection } from './components/CoverageSection';
import { HowItWorks } from './components/HowItWorks';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { ProcedureModal } from './components/ProcedureModal';
import { CheckoutDrawer } from './components/CheckoutDrawer';
import { OrdersDrawer } from './components/OrdersDrawer';
import { MercadoPagoModal } from './components/MercadoPagoModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Procedure, CartItem, OrderRecord, MercadoPagoConfig } from './types';
import { api } from './services/api';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vitale_the_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>({
    configured: false,
    mode: 'simulator',
    hasKey: false,
  });

  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isMpModalOpen, setIsMpModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast dispatcher
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('vitale_the_cart', JSON.stringify(cart));
  }, [cart]);

  // Load Mercado Pago config and orders on startup
  const fetchConfig = async () => {
    const cfg = await api.getConfig();
    setMpConfig(cfg);
  };

  const fetchOrders = async () => {
    const list = await api.getOrders();
    setOrders(list);
  };

  useEffect(() => {
    fetchConfig();
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Cart operations
  const handleAddToCart = (proc: Procedure) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === proc.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { ...proc, quantity: 1 }];
    });
    showToast(`${proc.name} adicionado ao agendamento!`, 'success');
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx].quantity += delta;
      if (copy[idx].quantity <= 0) {
        copy.splice(idx, 1);
        showToast('Procedimento removido.', 'info');
      }
      return copy;
    });
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    showToast('Procedimento removido do carrinho.', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('vitale_the_cart');
  };

  const handleOrderCompleted = (newOrder: OrderRecord) => {
    setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
    fetchOrders();
  };

  const handleSelectOrderFromNotif = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrdersOpen(true);
  };

  // Cart calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const hasConsulta = cart.some(item => item.id === 'consulta-avaliacao');
  const hasOther = cart.some(item => item.id !== 'consulta-avaliacao');
  const cartDiscount = (hasConsulta && hasOther) ? 100 : 0;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-onyx-950 text-neutral-200 font-sans antialiased flex flex-col justify-between selection:bg-gold-500/30 selection:text-gold-300">
      
      {/* Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        ordersCount={orders.length}
        mpConfig={mpConfig}
        onOpenCart={() => setIsCheckoutOpen(true)}
        onOpenOrders={() => {
          setSelectedOrderId(null);
          setIsOrdersOpen(true);
        }}
        onOpenMpSettings={() => setIsMpModalOpen(true)}
        onSelectOrder={handleSelectOrderFromNotif}
      />

      {/* Main Content */}
      <main className="flex-1">
        <Hero onExploreClick={() => {
          document.getElementById('procedimentos')?.scrollIntoView({ behavior: 'smooth' });
        }} />

        <ProceduresCatalog
          onSelectProcedure={(p) => setSelectedProcedure(p)}
          onAddToCart={handleAddToCart}
          cartItemIds={cart.map(c => c.id)}
        />

        <CoverageSection />
        <HowItWorks />
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer onOpenMpSettings={() => setIsMpModalOpen(true)} />

      {/* Modals & Drawers */}
      <ProcedureModal
        procedure={selectedProcedure}
        onClose={() => setSelectedProcedure(null)}
        onAddToCart={handleAddToCart}
      />

      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderCompleted={handleOrderCompleted}
        onOpenOrders={() => {
          setIsOrdersOpen(true);
          setSelectedOrderId(null);
        }}
        showToast={showToast}
      />

      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => {
          setIsOrdersOpen(false);
          setSelectedOrderId(null);
        }}
        orders={orders}
        onOrderUpdated={fetchOrders}
        selectedOrderId={selectedOrderId}
        showToast={showToast}
      />

      <MercadoPagoModal
        isOpen={isMpModalOpen}
        onClose={() => setIsMpModalOpen(false)}
        config={mpConfig}
        onConfigUpdated={() => {
          fetchConfig();
          fetchOrders();
        }}
        showToast={showToast}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
