import {
  PAYPAL_API,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE,
  PAYPAL_SANDBOX_API,
} from '../db/env';
import axios from 'axios';

const PAYPAL_BASE = PAYPAL_MODE === 'live' ? PAYPAL_API : PAYPAL_SANDBOX_API;

const getAccessToken = async (): Promise<string> => {
  const { data } = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      auth: {
        username: PAYPAL_CLIENT_ID,
        password: PAYPAL_CLIENT_SECRET,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return data.access_token as string;
};

// ── Create PayPal order ───────────────────────────────────────────────────────
export const createPayPalOrder = async (amount: number, orderId: string) => {
  const accessToken = await getAccessToken();

  const { data } = await axios.post(
    `${PAYPAL_BASE}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          amount: { currency_code: 'USD', value: amount.toFixed(2) },
        },
      ],
      // ── Uncomment when frontend is ready ─────────────────────────────────
      // application_context: {
      //   return_url: `${FRONTEND_URL}/payment/success?orderId=${orderId}`,
      //   cancel_url: `${FRONTEND_URL}/payment/cancel`,
      // },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return {
    paypalOrderId: data.id as string,
    approveUrl: data.links?.find((l: any) => l.rel === 'approve')
      ?.href as string,
  };
};

// ── Capture payment ───────────────────────────────────────────────────────────
export const capturePayPalPayment = async (paypalOrderId: string) => {
  const accessToken = await getAccessToken();

  const { data } = await axios.post(
    `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]
    ?.id as string;
  return { status: data.status as string, captureId };
};

// ── Refund ────────────────────────────────────────────────────────────────────
export const refundPayPalPayment = async (
  captureId: string,
  amount: number,
) => {
  const accessToken = await getAccessToken();

  const { data } = await axios.post(
    `${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`,
    {
      amount: { currency_code: 'USD', value: amount.toFixed(2) },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return data;
};