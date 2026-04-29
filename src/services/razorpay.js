/**
 * Razorpay Standard Checkout - browser glue.
 *
 * The backend creates an order via /api/v1/billing/checkout and returns the
 * fields needed to open the hosted checkout modal. This module:
 *   1. lazy-loads checkout.js from Razorpay's CDN once per page,
 *   2. builds the Standard Checkout `options` from the backend response, and
 *   3. resolves with the success payload (or rejects on failure / dismiss).
 *
 * Keeping the SDK loader behind a single `openRazorpayCheckout()` function
 * means the rest of the app (Pricing.jsx) stays provider-agnostic - the day
 * we swap to Stripe / Cashfree we replace this file only.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let _scriptPromise = null;

function loadCheckoutScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout requires a browser environment'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (_scriptPromise) return _scriptPromise;

  _scriptPromise = new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = CHECKOUT_SRC;
    tag.async = true;
    tag.onload = () => {
      if (window.Razorpay) resolve();
      else reject(new Error('Razorpay checkout.js loaded but window.Razorpay is missing'));
    };
    tag.onerror = () => {
      _scriptPromise = null; // allow retry
      reject(new Error('Failed to load Razorpay checkout.js'));
    };
    document.head.appendChild(tag);
  });
  return _scriptPromise;
}

/**
 * Open the Razorpay Standard Checkout modal.
 *
 * Auto-detects the flow from the backend response:
 *   * `checkout.subscription_id` → Subscriptions flow (recurring billing)
 *   * `checkout.order_id`        → Orders flow (one-time payment)
 *
 * The Razorpay handler returns different fields per flow; this function
 * normalises them into a single shape the backend's `/billing/verify`
 * endpoint accepts (it auto-detects the flow there too).
 *
 * @param {object} args
 * @param {object} args.checkout - body returned by POST /billing/checkout
 *   Must contain `public_key` + `amount` + `currency`, and exactly ONE of
 *   `order_id` or `subscription_id`.
 * @param {object} [args.prefill] - optional { name, email, contact }
 * @param {string} [args.brandName='AlphaDesk']
 * @param {string} [args.themeColor='#10b981']
 * @returns {Promise<{razorpay_payment_id, razorpay_signature, razorpay_order_id?, razorpay_subscription_id?}>}
 *   Resolves on successful payment, rejects on failure or dismiss.
 */
export async function openRazorpayCheckout({
  checkout,
  prefill,
  brandName = 'AlphaDesk',
  themeColor = '#10b981',
}) {
  if (!checkout?.public_key) {
    throw new Error('openRazorpayCheckout: missing public_key from backend');
  }
  if (!checkout.order_id && !checkout.subscription_id) {
    throw new Error(
      'openRazorpayCheckout: backend returned neither order_id nor subscription_id',
    );
  }

  await loadCheckoutScript();

  const isSubscription = Boolean(checkout.subscription_id);

  return new Promise((resolve, reject) => {
    let settled = false;

    const options = {
      key: checkout.public_key,
      // Razorpay derives amount from the subscription/plan, but supplying
      // it for orders is required and harmless for subscriptions.
      amount: String(checkout.amount),
      currency: checkout.currency || 'INR',
      name: brandName,
      description:
        checkout.description
        || `${checkout.tier_name} ${isSubscription ? 'subscription' : 'plan'}`,
      // Subscriptions checkout uses `subscription_id`, orders uses `order_id`.
      // Razorpay treats them as mutually exclusive, so we set exactly one.
      ...(isSubscription
        ? { subscription_id: checkout.subscription_id }
        : { order_id: checkout.order_id }),
      prefill: {
        name: prefill?.name ?? '',
        email: prefill?.email ?? checkout.prefill_email ?? '',
        contact: prefill?.contact ?? '',
      },
      notes: {
        tier: checkout.tier,
        receipt: checkout.receipt,
      },
      theme: { color: themeColor },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          if (settled) return;
          settled = true;
          const err = new Error('Checkout dismissed');
          err.code = 'CHECKOUT_DISMISSED';
          reject(err);
        },
      },
      handler: (response) => {
        if (settled) return;
        settled = true;
        // Normalise to a payload the backend can route on. Both id fields
        // are forwarded - exactly one will be populated depending on flow.
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          razorpay_order_id: response.razorpay_order_id ?? null,
          razorpay_subscription_id: response.razorpay_subscription_id ?? null,
        });
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      if (settled) return;
      settled = true;
      const err = new Error(response?.error?.description || 'Payment failed');
      err.code = response?.error?.code || 'PAYMENT_FAILED';
      err.razorpay = response?.error;
      reject(err);
    });

    rzp.open();
  });
}

export default openRazorpayCheckout;
