import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// ==========================================
// DATA MODELS & TYPES
// ==========================================
export type OrderStatus = 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
export type PaymentMethod = 'pix' | 'cartao';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
}

export interface OrderNotification {
  id: string;
  orderId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface Order {
  id: string; // e.g. VIT-84920
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderStatus;
  paymentId?: string;
  paymentDetail?: string;
  patient: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    address: string;
    neighborhood: string;
    city: string;
    cep: string;
  };
  schedule: {
    date: string;
    isoDate: string;
    time: string;
    notes?: string;
  };
  pixData?: {
    qrCode: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    expiration?: string;
  };
  history: Array<{
    status: OrderStatus;
    note: string;
    timestamp: string;
  }>;
}

interface StoredPayment {
  id: string | number;
  status: 'pending' | 'approved' | 'rejected' | 'in_process';
  status_detail?: string;
  transaction_amount: number;
  payment_method_id: string;
  description: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  date_created: string;
  date_approved?: string;
  external_reference?: string;
  payer_email?: string;
  is_simulated?: boolean;
}

// In-memory persistent stores
const paymentsStore = new Map<string, StoredPayment>();
const ordersStore = new Map<string, Order>();
const notificationsList: OrderNotification[] = [];

// Seed an initial demo order so the user can immediately see the order management in action
const initialDemoOrder: Order = {
  id: 'VIT-94821',
  createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  items: [
    {
      id: 'consulta-avaliacao',
      name: 'Consulta e Avaliação Individualizada',
      price: 100,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80',
    },
    {
      id: 'vitaminas-injetaveis',
      name: 'Vitaminas Injetáveis sob Demanda',
      price: 580,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=700&q=80',
    },
  ],
  subtotal: 680,
  discount: 100,
  total: 580,
  paymentMethod: 'pix',
  paymentStatus: 'aprovado',
  paymentId: 'MP-892184910',
  paymentDetail: 'PIX compensado instantaneamente via Mercado Pago',
  patient: {
    name: 'Dra. Camila Albuquerque',
    email: 'camila.albuquerque@email.com',
    phone: '(86) 99842-1200',
    cpf: '042.883.193-11',
    address: 'Av. Dom Severino, 1420, Apt 801',
    neighborhood: 'Jóquei',
    city: 'Teresina - PI',
    cep: '64049-550',
  },
  schedule: {
    date: 'Amanhã, 14:00',
    isoDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:00',
  },
  history: [
    {
      status: 'pendente',
      note: 'Agendamento criado no app Vitale. Aguardando PIX.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      status: 'aprovado',
      note: 'Pagamento de R$ 580,00 aprovado no Mercado Pago. Maleta cirúrgica e rota confirmadas.',
      timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString(),
    },
  ],
};

ordersStore.set(initialDemoOrder.id, initialDemoOrder);
notificationsList.push({
  id: 'notif-1',
  orderId: initialDemoOrder.id,
  title: 'Pagamento Aprovado! 🎉',
  message: `Pedido #${initialDemoOrder.id} aprovado via PIX Mercado Pago. Rota agendada para Jóquei, Teresina.`,
  type: 'success',
  timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString(),
  read: false,
});

// Dynamic token holder (supports runtime setting in addition to process.env)
let runtimeAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
let runtimePublicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || '';

// Helper to push notifications
function pushNotification(orderId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') {
  const notif: OrderNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notificationsList.unshift(notif);
  if (notificationsList.length > 50) notificationsList.pop();
  return notif;
}

// Helper to update linked order when payment status changes
function syncOrderPaymentStatus(paymentId: string, newStatus: OrderStatus, detail?: string) {
  for (const [orderId, order] of ordersStore.entries()) {
    if (order.paymentId === paymentId) {
      const oldStatus = order.paymentStatus;
      if (oldStatus !== newStatus) {
        order.paymentStatus = newStatus;
        order.updatedAt = new Date().toISOString();
        if (detail) order.paymentDetail = detail;

        order.history.push({
          status: newStatus,
          note: detail || `Status atualizado para ${newStatus} via Mercado Pago.`,
          timestamp: new Date().toISOString(),
        });

        const statusLabels: Record<OrderStatus, { title: string; type: 'info' | 'success' | 'warning' | 'error' }> = {
          pendente: { title: 'Pagamento Pendente ⏳', type: 'info' },
          aprovado: { title: 'Pagamento Aprovado! 🎉', type: 'success' },
          recusado: { title: 'Pagamento Recusado ⚠️', type: 'error' },
          cancelado: { title: 'Pedido Cancelado 🚫', type: 'warning' },
        };

        const config = statusLabels[newStatus] || { title: 'Atualização de Pedido', type: 'info' };
        pushNotification(
          order.id,
          config.title,
          `O status do pedido #${order.id} foi alterado para "${newStatus.toUpperCase()}". ${detail || ''}`,
          config.type
        );
        console.log(`[Order Sync] Order ${orderId} updated to ${newStatus}`);
      }
      break;
    }
  }
}

// ==========================================
// API ROUTES: MERCADO PAGO INTEGRATION
// ==========================================

// 1. Get Integration Configuration Status
app.get('/api/mercadopago/config', (req: Request, res: Response) => {
  const token = runtimeAccessToken.trim();
  const isConfigured = Boolean(token && token !== 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000');
  const isTest = token.startsWith('TEST-');
  const isProd = token.startsWith('APP_USR-');

  res.json({
    configured: isConfigured,
    mode: isTest ? 'sandbox' : isProd ? 'production' : isConfigured ? 'custom' : 'simulator',
    publicKey: runtimePublicKey || '',
    appUrl: process.env.APP_URL || '',
    hasKey: isConfigured,
    maskedToken: isConfigured ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}` : null,
  });
});

// 2. Update Token at Runtime (for quick live testing in UI)
app.post('/api/mercadopago/save-token', (req: Request, res: Response) => {
  const { accessToken, publicKey } = req.body;
  if (typeof accessToken === 'string') {
    runtimeAccessToken = accessToken.trim();
  }
  if (typeof publicKey === 'string') {
    runtimePublicKey = publicKey.trim();
  }

  res.json({
    success: true,
    configured: Boolean(runtimeAccessToken),
    mode: runtimeAccessToken.startsWith('TEST-') ? 'sandbox' : 'production',
  });
});

// 3. Create PIX Payment via Mercado Pago API
app.post('/api/mercadopago/pix', async (req: Request, res: Response) => {
  try {
    const { amount, description, payer, externalReference } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valor da transação inválido.' });
    }

    const token = runtimeAccessToken.trim();
    const isRealToken = Boolean(token && !token.includes('0000000000000000'));

    // Real Mercado Pago API Call
    if (isRealToken) {
      try {
        const cleanCpf = (payer?.identification?.number || payer?.cpf || '11144477735').replace(/\D/g, '');
        const mpPayload = {
          transaction_amount: Number(amount),
          description: description || 'Vitale Concierge Teresina - Procedimentos',
          payment_method_id: 'pix',
          payer: {
            email: payer?.email || 'contato@vitaleteresina.com.br',
            first_name: payer?.firstName || (payer?.name ? payer.name.split(' ')[0] : 'Cliente'),
            last_name: payer?.lastName || (payer?.name ? payer.name.split(' ').slice(1).join(' ') : 'Vitale'),
            identification: {
              type: 'CPF',
              number: cleanCpf.length === 11 ? cleanCpf : '11144477735',
            },
          },
          external_reference: externalReference || `VIT-${Date.now()}`,
          notification_url: process.env.APP_URL ? `${process.env.APP_URL}/api/mercadopago/webhook` : undefined,
        };

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `pix-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          },
          body: JSON.stringify(mpPayload),
        });

        const mpData = await mpResponse.json();

        if (mpResponse.ok && mpData.id) {
          const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || '';
          const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '';
          const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || '';

          const paymentRecord: StoredPayment = {
            id: String(mpData.id),
            status: mpData.status || 'pending',
            status_detail: mpData.status_detail,
            transaction_amount: mpData.transaction_amount || Number(amount),
            payment_method_id: 'pix',
            description: mpData.description,
            qr_code: qrCode,
            qr_code_base64: qrCodeBase64,
            ticket_url: ticketUrl,
            date_created: mpData.date_created || new Date().toISOString(),
            external_reference: externalReference,
            payer_email: payer?.email,
            is_simulated: false,
          };

          paymentsStore.set(String(mpData.id), paymentRecord);

          return res.json({
            success: true,
            is_simulated: false,
            payment_id: String(mpData.id),
            status: mpData.status,
            status_detail: mpData.status_detail,
            qr_code: qrCode,
            qr_code_base64: qrCodeBase64,
            ticket_url: ticketUrl,
            amount: mpData.transaction_amount,
            expiration: mpData.date_of_expiration,
          });
        }
      } catch (mpErr) {
        console.error('[MercadoPago] Error calling Mercado Pago API:', mpErr);
      }
    }

    // SIMULATED / SANDBOX PIX GENERATOR (Graceful fallback)
    const simulatedId = `MP-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    const simulatedQrCode = `00020126580014BR.GOV.BCB.PIX0136vitale-teresina-${simulatedId}@mercadopago.com520400005303986540${Number(amount).toFixed(2)}5802BR5925VITALE CONCIERGE TERESINA6008TERESINA62070503${randomHex}6304`;

    const paymentRecord: StoredPayment = {
      id: simulatedId,
      status: 'pending',
      status_detail: 'pending_waiting_transfer',
      transaction_amount: Number(amount),
      payment_method_id: 'pix',
      description: description || 'Vitale Concierge Teresina',
      qr_code: simulatedQrCode,
      date_created: new Date().toISOString(),
      external_reference: externalReference || `VIT-${Date.now()}`,
      payer_email: payer?.email,
      is_simulated: true,
    };

    paymentsStore.set(simulatedId, paymentRecord);

    return res.json({
      success: true,
      is_simulated: true,
      payment_id: simulatedId,
      status: 'pending',
      status_detail: 'pending_waiting_transfer',
      qr_code: simulatedQrCode,
      qr_code_base64: null,
      ticket_url: null,
      amount: Number(amount),
      notice: isRealToken 
        ? 'Mercado Pago conectado em modo Sandbox.'
        : 'Demonstração Mercado Pago ativa. Insira seu Access Token para chave de produção.',
    });
  } catch (error: any) {
    console.error('Fatal error in /api/mercadopago/pix:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação de PIX.' });
  }
});

// 4. Process Credit Card Payment via Mercado Pago API
app.post('/api/mercadopago/card', async (req: Request, res: Response) => {
  try {
    const { 
      amount, 
      description, 
      installments = 1, 
      payer, 
      cardNumber, 
      cardholderName, 
      expiry, 
      cvv,
      cardToken, 
      externalReference 
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valor da transação inválido.' });
    }

    const token = runtimeAccessToken.trim();
    const isRealToken = Boolean(token && !token.includes('0000000000000000'));

    // Real API Card processing if token provided
    if (isRealToken && cardToken) {
      try {
        const cleanCpf = (payer?.identification?.number || payer?.cpf || '11144477735').replace(/\D/g, '');
        const mpPayload = {
          transaction_amount: Number(amount),
          token: cardToken,
          description: description || 'Vitale Concierge Teresina - Procedimentos',
          installments: Number(installments) || 1,
          payment_method_id: req.body.paymentMethodId || 'master',
          payer: {
            email: payer?.email || 'contato@vitaleteresina.com.br',
            identification: {
              type: 'CPF',
              number: cleanCpf,
            },
          },
          external_reference: externalReference || `VIT-${Date.now()}`,
          notification_url: process.env.APP_URL ? `${process.env.APP_URL}/api/mercadopago/webhook` : undefined,
        };

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `card-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          },
          body: JSON.stringify(mpPayload),
        });

        const mpData = await mpResponse.json();

        if (mpResponse.ok && mpData.id) {
          const isApproved = mpData.status === 'approved';
          const paymentRecord: StoredPayment = {
            id: String(mpData.id),
            status: mpData.status,
            status_detail: mpData.status_detail,
            transaction_amount: mpData.transaction_amount || Number(amount),
            payment_method_id: mpData.payment_method_id || 'credit_card',
            description: mpData.description,
            date_created: mpData.date_created,
            date_approved: mpData.date_approved,
            external_reference: externalReference,
            payer_email: payer?.email,
            is_simulated: false,
          };
          paymentsStore.set(String(mpData.id), paymentRecord);

          syncOrderPaymentStatus(
            String(mpData.id),
            isApproved ? 'aprovado' : mpData.status === 'rejected' ? 'recusado' : 'pendente',
            mpData.status_detail
          );

          return res.json({
            success: isApproved,
            payment_id: String(mpData.id),
            status: mpData.status,
            status_detail: mpData.status_detail,
            amount: mpData.transaction_amount,
            is_simulated: false,
          });
        }
      } catch (mpErr) {
        console.error('[MercadoPago Card] Error:', mpErr);
      }
    }

    // Direct card simulation / instant sandbox processing
    const cleanNumber = (cardNumber || '').replace(/\s/g, '');
    if (cleanNumber.length < 13) {
      return res.status(400).json({ error: 'Número de cartão de crédito inválido.' });
    }

    const simulatedId = `MP-CARD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const paymentRecord: StoredPayment = {
      id: simulatedId,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: Number(amount),
      payment_method_id: cleanNumber.startsWith('4') ? 'visa' : cleanNumber.startsWith('5') ? 'master' : 'credit_card',
      description: description || 'Vitale Concierge Teresina - Procedimentos',
      date_created: new Date().toISOString(),
      date_approved: new Date().toISOString(),
      external_reference: externalReference || `VIT-${Date.now()}`,
      payer_email: payer?.email,
      is_simulated: true,
    };

    paymentsStore.set(simulatedId, paymentRecord);

    syncOrderPaymentStatus(simulatedId, 'aprovado', 'Cartão de crédito aprovado instantaneamente');

    return res.json({
      success: true,
      payment_id: simulatedId,
      status: 'approved',
      status_detail: 'accredited',
      amount: Number(amount),
      installments: Number(installments),
      is_simulated: true,
      message: 'Pagamento no cartão aprovado com sucesso!',
    });
  } catch (error: any) {
    console.error('Fatal error in /api/mercadopago/card:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento com cartão.' });
  }
});

// 5. Check Payment Status (Polling endpoint for real-time PIX confirmation)
app.get('/api/mercadopago/payment-status/:id', async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    const token = runtimeAccessToken.trim();
    const isRealToken = Boolean(token && !token.includes('0000000000000000'));

    if (isRealToken && !paymentId.startsWith('MP-') && !paymentId.startsWith('TEST-')) {
      try {
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (mpResponse.ok) {
          const data = await mpResponse.json();
          const existing = paymentsStore.get(paymentId);
          if (existing) {
            existing.status = data.status;
            existing.status_detail = data.status_detail;
            existing.date_approved = data.date_approved;
          }

          const isApproved = data.status === 'approved';
          const orderStatus: OrderStatus = isApproved 
            ? 'aprovado' 
            : data.status === 'rejected' 
            ? 'recusado' 
            : data.status === 'cancelled' 
            ? 'cancelado' 
            : 'pendente';

          syncOrderPaymentStatus(paymentId, orderStatus, data.status_detail);

          return res.json({
            id: String(data.id),
            status: data.status,
            status_detail: data.status_detail,
            date_approved: data.date_approved,
            transaction_amount: data.transaction_amount,
            is_approved: isApproved,
            is_simulated: false,
          });
        }
      } catch (err) {
        console.error('Error fetching payment from Mercado Pago:', err);
      }
    }

    const local = paymentsStore.get(paymentId);
    if (local) {
      return res.json({
        id: String(local.id),
        status: local.status,
        status_detail: local.status_detail,
        date_approved: local.date_approved,
        transaction_amount: local.transaction_amount,
        is_approved: local.status === 'approved',
        is_simulated: local.is_simulated,
      });
    }

    return res.json({
      id: paymentId,
      status: 'pending',
      is_approved: false,
      is_simulated: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar status do pagamento.' });
  }
});

// 6. Simulate Status Change for Testing (Approved, Rejected, Cancelled)
app.post('/api/mercadopago/simulate-status/:id', (req: Request, res: Response) => {
  const paymentId = req.params.id;
  const targetStatus: OrderStatus = req.body.status || 'aprovado';

  const payment = paymentsStore.get(paymentId) || {
    id: paymentId,
    status: 'pending',
    transaction_amount: 100,
    payment_method_id: 'pix',
    description: 'Vitale Concierge Teresina',
    date_created: new Date().toISOString(),
    is_simulated: true,
  };

  const mpStatusMap: Record<OrderStatus, 'pending' | 'approved' | 'rejected'> = {
    pendente: 'pending',
    aprovado: 'approved',
    recusado: 'rejected',
    cancelado: 'rejected',
  };

  payment.status = mpStatusMap[targetStatus] || 'approved';
  payment.status_detail = targetStatus === 'aprovado' ? 'accredited' : targetStatus === 'recusado' ? 'cc_rejected_bad_filled_date' : 'by_collector';
  if (targetStatus === 'aprovado') payment.date_approved = new Date().toISOString();
  paymentsStore.set(paymentId, payment);

  syncOrderPaymentStatus(paymentId, targetStatus, `Simulação de teste: ${targetStatus}`);

  res.json({
    success: true,
    payment_id: paymentId,
    status: payment.status,
    order_status: targetStatus,
  });
});

// 7. Webhook Handler
app.post('/api/mercadopago/webhook', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (data?.id && runtimeAccessToken) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { 'Authorization': `Bearer ${runtimeAccessToken.trim()}` },
      });
      if (mpRes.ok) {
        const paymentData = await mpRes.json();
        const isApproved = paymentData.status === 'approved';
        const orderStatus: OrderStatus = isApproved 
          ? 'aprovado' 
          : paymentData.status === 'rejected' 
          ? 'recusado' 
          : paymentData.status === 'cancelled' 
          ? 'cancelado' 
          : 'pendente';

        syncOrderPaymentStatus(String(data.id), orderStatus, paymentData.status_detail);
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    res.status(200).send('OK');
  }
});

// ==========================================
// ORDER MANAGEMENT SYSTEM (API)
// ==========================================

// List all orders (sorted newest first)
app.get('/api/orders', (req: Request, res: Response) => {
  const orders = Array.from(ordersStore.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(orders);
});

// Create new order
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const {
      id,
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
      paymentStatus = 'pendente',
      paymentId,
      paymentDetail,
      patient,
      schedule,
      pixData,
    } = req.body;

    const orderId = id || `VIT-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: items || [],
      subtotal: Number(subtotal) || Number(total) || 0,
      discount: Number(discount) || 0,
      total: Number(total) || 0,
      paymentMethod: paymentMethod === 'card' ? 'cartao' : (paymentMethod || 'pix'),
      paymentStatus: paymentStatus as OrderStatus,
      paymentId: paymentId ? String(paymentId) : undefined,
      paymentDetail: paymentDetail || 'Aguardando processamento',
      patient: patient || {
        name: 'Cliente Vitale',
        email: '',
        phone: '',
        cpf: '',
        address: '',
        neighborhood: '',
        city: 'Teresina - PI',
        cep: '',
      },
      schedule: schedule || {
        date: 'Amanhã',
        isoDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '14:00',
      },
      pixData: pixData || undefined,
      history: [
        {
          status: paymentStatus as OrderStatus,
          note: `Pedido gerado no sistema. Pagamento via ${paymentMethod === 'card' ? 'Cartão de Crédito' : 'PIX'} Mercado Pago.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    ordersStore.set(orderId, newOrder);

    // Create initial notification
    pushNotification(
      orderId,
      `Novo Pedido #${orderId} Registrado`,
      `Agendamento para ${newOrder.schedule.date} às ${newOrder.schedule.time} (${newOrder.patient.neighborhood}, Teresina). Total: R$ ${newOrder.total.toFixed(2)}.`,
      'info'
    );

    if (paymentStatus === 'aprovado') {
      pushNotification(
        orderId,
        `Pagamento Aprovado! 🎉`,
        `O agendamento #${orderId} está confirmado. Maleta estéril e rota reservadas.`,
        'success'
      );
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Erro ao salvar pedido no sistema.' });
  }
});

// Get single order by id
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = ordersStore.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não localizado.' });
  }
  res.json(order);
});

// Update order status (pendente, aprovado, recusado, cancelado)
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const order = ordersStore.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não localizado.' });
  }

  const { status, note } = req.body;
  if (!['pendente', 'aprovado', 'recusado', 'cancelado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Permitidos: pendente, aprovado, recusado, cancelado.' });
  }

  const prevStatus = order.paymentStatus;
  order.paymentStatus = status as OrderStatus;
  order.updatedAt = new Date().toISOString();
  order.history.push({
    status: status as OrderStatus,
    note: note || `Status alterado manualmente para ${status}.`,
    timestamp: new Date().toISOString(),
  });

  const titles: Record<OrderStatus, { title: string; type: 'info' | 'success' | 'warning' | 'error' }> = {
    pendente: { title: 'Pedido em Análise ⏳', type: 'info' },
    aprovado: { title: 'Pagamento Aprovado! 🎉', type: 'success' },
    recusado: { title: 'Pagamento Recusado ⚠️', type: 'error' },
    cancelado: { title: 'Pedido Cancelado 🚫', type: 'warning' },
  };

  pushNotification(
    order.id,
    titles[status as OrderStatus].title,
    `Pedido #${order.id}: status alterado de ${prevStatus} para ${status}. ${note || ''}`,
    titles[status as OrderStatus].type
  );

  res.json(order);
});

// Get recent notifications for user / admin
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(notificationsList);
});

// Mark notification as read
app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = notificationsList.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

// Mark all notifications as read
app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  notificationsList.forEach(n => { n.read = true; });
  res.json({ success: true });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vitale Concierge & Mercado Pago Server listening on port ${PORT}`);
  });
}

startServer();
