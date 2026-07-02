const Stripe = require('stripe');
const { getPriceId } = require('../config/stripePlans');

let stripeClient;

function getStripeClient() {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

async function createCustomer({ gymId, email, name }) {
  const stripe = getStripeClient();
  return stripe.customers.create({
    email,
    name,
    metadata: { gymId: String(gymId) },
  });
}

async function createCheckoutSession({ gymId, customerId, planId, successUrl, cancelUrl }) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: getPriceId(planId), quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: String(gymId),
    metadata: { gymId: String(gymId) },
    subscription_data: { metadata: { gymId: String(gymId) } },
  });
}

async function createPortalSession({ customerId, returnUrl }) {
  const stripe = getStripeClient();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Requires the raw (unparsed) request body - see routes/webhooks/stripe.routes.js.
function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

module.exports = {
  getStripeClient,
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
};
