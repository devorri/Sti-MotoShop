/**
 * SMS Notification Service
 * Powered by Semaphore SMS Gateway (Philippines)
 * Sender Name: TranslertPH
 */

const SEMAPHORE_API_KEY = import.meta.env.VITE_SEMAPHORE_API_KEY || 'f18fe7eb9f2f4b5477776b98d8b55565';
const DEFAULT_SENDER_NAME = import.meta.env.VITE_SEMAPHORE_SENDER_NAME || 'TranslertPH';

export interface SmsSendResult {
  success: boolean;
  messageId?: number;
  recipient?: string;
  network?: string;
  creditBalance?: number;
  error?: string;
  raw?: any;
}

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  recipient: string;
  message: string;
  senderName: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  messageId?: number;
  error?: string;
}

/**
 * Standardize Philippine mobile numbers
 * Accepts: "09171234567", "+639171234567", "639171234567", "917-123-4567"
 * Output: "09171234567"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Strip all non-digit characters except '+'
  let clean = phone.replace(/[^0-9]/g, '');

  if (clean.startsWith('63') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  } else if (clean.length === 10 && clean.startsWith('9')) {
    clean = '0' + clean;
  }
  return clean;
}

/**
 * Validates if the phone number is a valid 11-digit Philippine mobile number (09XXXXXXXXX)
 */
export function isValidPhilippineNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return /^09\d{9}$/.test(formatted);
}

/**
 * Fetch Semaphore account info (credits balance, account name, status)
 */
export async function getSmsAccountInfo(): Promise<{
  success: boolean;
  accountId?: number;
  accountName?: string;
  status?: string;
  creditBalance?: number;
  error?: string;
}> {
  try {
    const url = `/api/semaphore/account?apikey=${SEMAPHORE_API_KEY}`;
    let res = await fetch(url).catch(() => null);

    // Fallback to direct URL if proxy is unavailable
    if (!res || !res.ok) {
      res = await fetch(`https://api.semaphore.co/api/v4/account?apikey=${SEMAPHORE_API_KEY}`);
    }

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      success: true,
      accountId: data.account_id,
      accountName: data.account_name,
      status: data.status,
      creditBalance: data.credit_balance
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch account info' };
  }
}

/**
 * Save SMS dispatch log to localStorage for audit inspection
 */
function recordSmsLog(entry: SmsLogEntry) {
  try {
    const raw = localStorage.getItem('motoshop_sms_logs');
    const logs: SmsLogEntry[] = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    localStorage.setItem('motoshop_sms_logs', JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    // Ignore storage errors
  }
}

export function getSmsLogs(): SmsLogEntry[] {
  try {
    const raw = localStorage.getItem('motoshop_sms_logs');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Core send SMS function via Semaphore API
 */
export async function sendSms(params: {
  to: string;
  message: string;
  senderName?: string;
}): Promise<SmsSendResult> {
  const formattedPhone = formatPhoneNumber(params.to);

  if (!formattedPhone || formattedPhone.length < 11) {
    return {
      success: false,
      error: `Invalid Philippine mobile number: "${params.to}". Must be an 11-digit number (e.g. 09171234567).`
    };
  }

  // Semaphore documentation note: messages should not start with "TEST"
  let cleanMessage = params.message.trim();
  if (cleanMessage.toUpperCase().startsWith('TEST')) {
    cleanMessage = 'Boss Rap Alert: ' + cleanMessage;
  }

  const sender = params.senderName || DEFAULT_SENDER_NAME;

  const payload = new URLSearchParams({
    apikey: SEMAPHORE_API_KEY,
    number: formattedPhone,
    message: cleanMessage,
    sendername: sender
  });

  const logEntry: SmsLogEntry = {
    id: `SMS_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    recipient: formattedPhone,
    message: cleanMessage,
    senderName: sender,
    status: 'PENDING'
  };

  try {
    // 1. Try sending via local Vite proxy to avoid browser CORS
    let res = await fetch('/api/semaphore/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    }).catch(() => null);

    // 2. Direct fallback if proxy is inactive
    if (!res || !res.ok) {
      res = await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload.toString()
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logEntry.status = 'FAILED';
      logEntry.error = `HTTP ${res.status}: ${errText}`;
      recordSmsLog(logEntry);
      return {
        success: false,
        error: `Semaphore API error (HTTP ${res.status}): ${errText || res.statusText}`
      };
    }

    const data = await res.json();
    const firstResult = Array.isArray(data) ? data[0] : data;

    logEntry.status = 'SENT';
    logEntry.messageId = firstResult?.message_id;
    recordSmsLog(logEntry);

    return {
      success: true,
      messageId: firstResult?.message_id,
      recipient: firstResult?.recipient || formattedPhone,
      network: firstResult?.network,
      raw: data
    };
  } catch (err: any) {
    logEntry.status = 'FAILED';
    logEntry.error = err.message || 'Network request failed';
    recordSmsLog(logEntry);

    return {
      success: false,
      error: err.message || 'Failed to dispatch SMS through Semaphore gateway.'
    };
  }
}

/**
 * Pre-configured Customer SMS Templates
 */

// 1. New Order Confirmation
export async function sendOrderConfirmationSms(order: {
  phone: string;
  orderId: string;
  total: number;
  paymentMethod: string;
  fulfillmentType: string;
  customerName?: string;
}): Promise<SmsSendResult> {
  const nameGreeting = order.customerName ? `Hi ${order.customerName}! ` : '';
  const message = `Boss Rap Motor Shop: ${nameGreeting}Your order #${order.orderId} (₱${order.total.toLocaleString()}) has been received! Fulfillment: ${order.fulfillmentType}. We are preparing your items. Thank you!`;
  return sendSms({ to: order.phone, message });
}

// 2. Out For Delivery Notification
export async function sendOutForDeliverySms(params: {
  phone: string;
  orderId: string;
  riderName?: string;
  address?: string;
}): Promise<SmsSendResult> {
  const rider = params.riderName || 'our delivery rider';
  const message = `Boss Rap Logistics: Order #${params.orderId} is now OUT FOR DELIVERY with ${rider}! Please keep your phone reachable for parcel drop-off. Salamat!`;
  return sendSms({ to: params.phone, message });
}

// 3. Delivery Completed Notification
export async function sendDeliveryCompletedSms(params: {
  phone: string;
  orderId: string;
  customerName?: string;
}): Promise<SmsSendResult> {
  const greeting = params.customerName ? `Hi ${params.customerName}, ` : '';
  const message = `Boss Rap Motor Shop: ${greeting}Order #${params.orderId} has been successfully DELIVERED! Enjoy your motorcycle parts & tuning. Ride safe!`;
  return sendSms({ to: params.phone, message });
}

// 4. Payment Verification Alert
export async function sendPaymentVerifiedSms(params: {
  phone: string;
  orderId: string;
  amount: number;
  paymentRef?: string;
}): Promise<SmsSendResult> {
  const refText = params.paymentRef ? ` (Ref: ${params.paymentRef})` : '';
  const message = `Boss Rap Motor Shop: Payment of ₱${params.amount.toLocaleString()}${refText} for Order #${params.orderId} is VERIFIED! Your parcel is being packed for dispatch.`;
  return sendSms({ to: params.phone, message });
}

// 5. Password Reset OTP Verification
export async function sendPasswordResetOtpSms(params: {
  phone: string;
  otpCode: string;
  expirationMinutes?: number;
}): Promise<SmsSendResult> {
  const mins = params.expirationMinutes || 15;
  const message = `Boss Rap Motor Shop: Your password reset One-Time PIN (OTP) is ${params.otpCode}. Valid for ${mins} minutes. Do not share this code with anyone.`;
  return sendSms({ to: params.phone, message });
}

// 6. New account verification
export async function sendRegistrationOtpSms(params: {
  phone: string;
  otpCode: string;
  expirationMinutes?: number;
}): Promise<SmsSendResult> {
  const mins = params.expirationMinutes || 10;
  const message = `Boss Rap Motor Shop: Your account verification OTP is ${params.otpCode}. Valid for ${mins} minutes. Do not share this code with anyone.`;
  return sendSms({ to: params.phone, message });
}

