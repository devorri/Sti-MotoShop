/**
 * PayMongo QR Ph Payment Gateway Service
 * Provides automated QR Ph generation, dynamic base64 QR presentation,
 * and real-time payment status polling.
 */

export const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY || 'sk_test_FkiJvhdMVwvSBZtbYcBzg2rY';
export const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || 'pk_test_T8Qk5XH8tag3L8uCsRwxHwgY';

export interface PayMongoQrResponse {
  success: boolean;
  paymentIntentId?: string;
  clientKey?: string;
  qrCodeUrl?: string; // Base64 data:image/png;base64,...
  testUrl?: string;   // Simulation URL in test mode
  amount?: number;    // Amount in PHP
  expiresAt?: string;
  status?: string;
  error?: string;
}

export interface PaymentStatusCheck {
  success: boolean;
  status: 'awaiting_payment_method' | 'awaiting_next_action' | 'processing' | 'succeeded' | 'cancelled' | string;
  paid: boolean;
  paymentId?: string;
  amount?: number;
  error?: string;
}

/**
 * Helper to build Basic Auth header for PayMongo
 */
function getAuthHeader(secretKey: string = PAYMONGO_SECRET_KEY): string {
  // PayMongo uses Basic Auth with secret_key as the username and empty password
  const token = btoa(`${secretKey.trim()}:`);
  return `Basic ${token}`;
}

/**
 * Determine base API URL (proxy endpoint or direct fallback)
 */
async function fetchPaymongo(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': getAuthHeader(),
    ...(options.headers || {})
  };

  // Try local proxy first to avoid any browser CORS issues
  try {
    const proxyUrl = `/api/paymongo${endpoint}`;
    const res = await fetch(proxyUrl, { ...options, headers });
    if (res.ok || res.status === 400 || res.status === 401 || res.status === 422) {
      return res;
    }
  } catch (err) {
    // If proxy fails (e.g. during static preview), fall back to direct PayMongo endpoint
  }

  const directUrl = `https://api.paymongo.com/v1${endpoint}`;
  return fetch(directUrl, { ...options, headers });
}

/**
 * 1. Create a dynamic QR Ph Payment Intent and attach QR Ph payment method
 * @param amountInPhp Total amount in PHP (e.g. 550 or 1250.50)
 * @param description Order or receipt description
 */
export async function createQrPhPayment(params: {
  amountInPhp: number;
  description?: string;
  orderId?: string;
}): Promise<PayMongoQrResponse> {
  try {
    const { amountInPhp, description, orderId } = params;

    // PayMongo minimum amount is 20 PHP (2000 centavos)
    const safeAmount = Math.max(20, amountInPhp);
    const amountInCentavos = Math.round(safeAmount * 100);

    // Step 1: Create Payment Intent
    const piPayload = {
      data: {
        attributes: {
          amount: amountInCentavos,
          currency: 'PHP',
          payment_method_allowed: ['qrph'],
          payment_method_options: {
            card: {
              request_three_d_secure: 'any'
            }
          },
          description: description || `Boss Rap Motor Shop Order ${orderId ? '#' + orderId : ''}`.trim()
        }
      }
    };

    const piRes = await fetchPaymongo('/payment_intents', {
      method: 'POST',
      body: JSON.stringify(piPayload)
    });

    if (!piRes.ok) {
      const errJson = await piRes.json().catch(() => ({}));
      const errMsg = errJson?.errors?.[0]?.detail || `Failed to create payment intent (HTTP ${piRes.status})`;
      return { success: false, error: errMsg };
    }

    const piData = await piRes.json();
    const paymentIntentId = piData?.data?.id;
    const clientKey = piData?.data?.attributes?.client_key;

    if (!paymentIntentId || !clientKey) {
      return { success: false, error: 'Invalid Payment Intent response from PayMongo' };
    }

    // Step 2: Create Payment Method of type 'qrph'
    const pmPayload = {
      data: {
        attributes: {
          type: 'qrph'
        }
      }
    };

    const pmRes = await fetchPaymongo('/payment_methods', {
      method: 'POST',
      body: JSON.stringify(pmPayload)
    });

    if (!pmRes.ok) {
      const errJson = await pmRes.json().catch(() => ({}));
      const errMsg = errJson?.errors?.[0]?.detail || `Failed to create QR Ph payment method (HTTP ${pmRes.status})`;
      return { success: false, error: errMsg };
    }

    const pmData = await pmRes.json();
    const paymentMethodId = pmData?.data?.id;

    if (!paymentMethodId) {
      return { success: false, error: 'Could not generate QR Ph payment method' };
    }

    // Step 3: Attach Payment Method to Payment Intent
    const attachPayload = {
      data: {
        attributes: {
          payment_method: paymentMethodId,
          client_key: clientKey
        }
      }
    };

    const attachRes = await fetchPaymongo(`/payment_intents/${paymentIntentId}/attach`, {
      method: 'POST',
      body: JSON.stringify(attachPayload)
    });

    if (!attachRes.ok) {
      const errJson = await attachRes.json().catch(() => ({}));
      const errMsg = errJson?.errors?.[0]?.detail || `Failed to attach payment method (HTTP ${attachRes.status})`;
      return { success: false, error: errMsg };
    }

    const attachData = await attachRes.json();
    const nextAction = attachData?.data?.attributes?.next_action;
    const codeObj = nextAction?.code;

    const qrCodeUrl = codeObj?.image_url;
    const testUrl = codeObj?.test_url;
    const expiresAt = codeObj?.expires_at;

    if (!qrCodeUrl) {
      return { success: false, error: 'PayMongo did not return a valid QR Ph code image' };
    }

    return {
      success: true,
      paymentIntentId,
      clientKey,
      qrCodeUrl,
      testUrl,
      amount: safeAmount,
      expiresAt,
      status: attachData?.data?.attributes?.status
    };
  } catch (err: any) {
    console.error('PayMongo QR Ph error:', err);
    return {
      success: false,
      error: err.message || 'Network error while generating QR Ph code'
    };
  }
}

/**
 * 2. Check current status of a Payment Intent (Poll for customer scan & payment)
 */
export async function checkPaymentIntentStatus(paymentIntentId: string): Promise<PaymentStatusCheck> {
  try {
    const res = await fetchPaymongo(`/payment_intents/${paymentIntentId}`);

    if (!res.ok) {
      return {
        success: false,
        status: 'unknown',
        paid: false,
        error: `HTTP ${res.status}: ${res.statusText}`
      };
    }

    const data = await res.json();
    const attributes = data?.data?.attributes;
    const status = attributes?.status || 'unknown';
    const payments = attributes?.payments || [];
    const paymentId = payments.length > 0 ? payments[0]?.id : undefined;

    return {
      success: true,
      status,
      paid: status === 'succeeded',
      paymentId: paymentId || paymentIntentId,
      amount: attributes?.amount ? attributes.amount / 100 : undefined
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      paid: false,
      error: err.message || 'Failed to check payment status'
    };
  }
}
