import { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE } from '../db/env';

const PAYPAL_BASE =
  PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const getAccessToken = async (): Promise<string> => {
  const credentials = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
};

// ── Create PayPal order ───────────────────────────────────────────────────────
export const createPayPalOrder = async (amount: number, orderId: string) => {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          amount: { currency_code: 'USD', value: amount.toFixed(2) },
        },
      ],
    }),
  });

  const data = (await res.json()) as any;
  return {
    paypalOrderId: data.id as string,
    approveUrl: data.links?.find((l: any) => l.rel === 'approve')
      ?.href as string,
  };
};

// ── Capture payment ───────────────────────────────────────────────────────────
export const capturePayPalPayment = async (paypalOrderId: string) => {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const data = (await res.json()) as any;
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

  const res = await fetch(
    `${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { currency_code: 'USD', value: amount.toFixed(2) },
      }),
    },
  );

  return res.json() as Promise<any>;
};
