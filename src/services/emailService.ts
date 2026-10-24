/**
 * Email Notification Service
 * Powered by EmailJS
 * Service ID: service_lqer3ar
 * Public Key: YnLtEp4Vrq-l6Abi2
 * OTP Template: template_vv1yt2a
 * Order Confirmation Template: template_fvt2ftq
 */

export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_lqer3ar';
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YnLtEp4Vrq-l6Abi2';
export const EMAILJS_OTP_TEMPLATE = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE || 'template_vv1yt2a';
export const EMAILJS_ORDER_TEMPLATE = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE || 'template_fvt2ftq';

export interface EmailSendResult {
  success: boolean;
  status?: number;
  text?: string;
  error?: string;
}

export interface OrderItemEmailPayload {
  name: string;
  units: number;
  price: string;
  image_url?: string;
}

/**
 * Generic core email dispatcher using EmailJS REST API
 */
export async function sendEmailJs(params: {
  templateId: string;
  templateParams: Record<string, any>;
}): Promise<EmailSendResult> {
  try {
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: params.templateId,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: params.templateParams
    };

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const text = await res.text().catch(() => 'OK');
      return { success: true, status: res.status, text };
    } else {
      const errText = await res.text().catch(() => res.statusText);
      console.warn('EmailJS error:', res.status, errText);
      return { success: false, status: res.status, error: errText };
    }
  } catch (err: any) {
    console.error('EmailJS request failed:', err);
    return { success: false, error: err.message || 'Network error while dispatching email.' };
  }
}

/**
 * 1. Send One Time Password (OTP) Email (template_vv1yt2a)
 */
export async function sendOtpEmail(params: {
  email: string;
  passcode: string;
  expirationMinutes?: number;
  toName?: string;
}): Promise<EmailSendResult> {
  const { email, passcode, expirationMinutes = 15, toName } = params;

  // Calculate expiration time (e.g., 7:35 AM)
  const expDate = new Date(Date.now() + expirationMinutes * 60 * 1000);
  const timeFormatted = expDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return sendEmailJs({
    templateId: EMAILJS_OTP_TEMPLATE,
    templateParams: {
      email,
      to_email: email,
      to_name: toName || 'Valued Rider',
      passcode,
      time: timeFormatted
    }
  });
}

/**
 * 2. Send Order Confirmation Email (template_fvt2ftq)
 */
export async function sendOrderConfirmationEmail(params: {
  email: string;
  orderId: string;
  toName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  shippingFee: number;
  taxAmount?: number;
  total: number;
}): Promise<EmailSendResult> {
  const { email, orderId, toName, items, shippingFee, taxAmount = 0, total } = params;

  const ordersPayload: OrderItemEmailPayload[] = items.map(item => ({
    name: item.name,
    units: item.quantity,
    price: item.price.toLocaleString(),
    image_url: item.image_url || 'https://raw.githubusercontent.com/devorri/Sti-MotoShop/main/public/boss-rap-logo.png'
  }));

  return sendEmailJs({
    templateId: EMAILJS_ORDER_TEMPLATE,
    templateParams: {
      email,
      to_email: email,
      to_name: toName || 'Valued Customer',
      order_id: orderId,
      orders: ordersPayload,
      cost: {
        shipping: shippingFee.toLocaleString(),
        tax: taxAmount.toLocaleString(),
        total: total.toLocaleString()
      }
    }
  });
}
