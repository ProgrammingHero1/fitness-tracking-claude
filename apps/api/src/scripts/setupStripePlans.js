require('dotenv').config();

const Stripe = require('stripe');
const { PLAN_DEFINITIONS } = require('../config/stripePlans');

async function run() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY must be set in the environment.');
  }

  const stripe = new Stripe(secretKey);
  const lines = [];

  for (const [planId, def] of Object.entries(PLAN_DEFINITIONS)) {
    const product = await stripe.products.create({ name: def.name, metadata: { planId } });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: def.amount,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`Created plan "${planId}": product ${product.id}, price ${price.id}`);
    lines.push(`${def.priceEnvVar}=${price.id}`);
  }

  console.log('\nAdd these to apps/api/.env:\n');
  console.log(lines.join('\n'));
}

run().catch((err) => {
  console.error('Failed to set up Stripe plans:', err);
  process.exit(1);
});
