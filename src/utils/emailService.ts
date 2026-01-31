const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

const EMAILJS_CONFIG = {
  serviceId: 'service_2qm6sy5',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  templateIds: {
    verification: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    p2pTrade: 'template_2uw732e'
  }
};

async function sendViaEmailJS(templateId: string, templateParams: Record<string, any>) {
  const payload = {
    service_id: EMAILJS_CONFIG.serviceId,
    template_id: templateId,
    user_id: EMAILJS_CONFIG.publicKey,
    template_params: templateParams
  };

  const res = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'EmailJS failed');
  }
}

export async function sendVerificationEmail(email: string, code: string, firstName: string) {
  await sendViaEmailJS(EMAILJS_CONFIG.templateIds.verification, {
    to_email: email,
    to_name: firstName,
    verification_code: code
  });
}

export async function sendP2PTradeStatusEmail(
  recipientEmail: string,
  title: string,
  message: string,
  tradeDetails: {
    tradeId: string;
    stockSymbol: string;
    quantity: number;
    pricePerShare: number;
    totalAmount: number;
    status: string;
    isSwapTrade?: boolean;
    swapStockSymbol?: string;
    swapQuantity?: number;
    cancelledBy?: string;
    cancellationReason?: string;
  },
  ctaLink?: string,
  ctaText?: string,
  isAdmin?: boolean
) {
  console.log(recipientEmail)
  const templateParams: Record<string, any> = {
    to_email: "adikaatudemy@gmail.com",
    email: "adikaatudemy@gmail.com",
    website_link: 'http://localhost:5173',

    title,
    message,

    trade_id: tradeDetails.tradeId,
    stock_symbol: tradeDetails.stockSymbol,
    quantity: tradeDetails.quantity,
    price_per_share: tradeDetails.pricePerShare.toFixed(2),
    total_amount: tradeDetails.totalAmount.toFixed(2),
    status: tradeDetails.status
  };

  if (tradeDetails.isSwapTrade) {
    templateParams.is_swap_trade = true;
    templateParams.swap_stock_symbol = tradeDetails.swapStockSymbol;
    templateParams.swap_quantity = tradeDetails.swapQuantity;
  }

  if (tradeDetails.cancelledBy) {
    templateParams.cancelled_by = tradeDetails.cancelledBy;
  }

  if (tradeDetails.cancellationReason) {
    templateParams.cancellation_reason = tradeDetails.cancellationReason;
  }

  if (ctaLink) {
    templateParams.cta_link = `${templateParams.website_link}${ctaLink}`;
    templateParams.cta_text = ctaText || 'View Trade';
  }

  if (isAdmin) {
    templateParams.is_admin = true;
  }

  await sendViaEmailJS(
    EMAILJS_CONFIG.templateIds.p2pTrade,
    templateParams
  );
}


export default {
  sendVerificationEmail,
  sendP2PTradeStatusEmail
};
