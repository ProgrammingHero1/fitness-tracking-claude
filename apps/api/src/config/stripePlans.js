// Plan tiers offered to gyms. `amount` is in cents, used only by scripts/setupStripePlans.js
// to create the Products/Prices in Stripe; runtime code only ever needs the resolved price ID.
const PLAN_DEFINITIONS = {
  basic: {
    name: 'Basic',
    amount: 4900,
    priceEnvVar: 'STRIPE_PRICE_ID_BASIC',
  },
  pro: {
    name: 'Pro',
    amount: 9900,
    priceEnvVar: 'STRIPE_PRICE_ID_PRO',
  },
};

function getStripePlans() {
  return Object.fromEntries(
    Object.entries(PLAN_DEFINITIONS).map(([planId, def]) => [
      planId,
      { ...def, priceId: process.env[def.priceEnvVar] || null },
    ])
  );
}

function getPriceId(planId) {
  const def = PLAN_DEFINITIONS[planId];
  if (!def) {
    throw new Error(`Unknown plan "${planId}"`);
  }
  const priceId = process.env[def.priceEnvVar];
  if (!priceId) {
    throw new Error(`No Stripe price configured for plan "${planId}" (set ${def.priceEnvVar})`);
  }
  return priceId;
}

function getPlanIdByPriceId(priceId) {
  const entry = Object.entries(getStripePlans()).find(([, def]) => def.priceId === priceId);
  return entry ? entry[0] : null;
}

module.exports = { PLAN_DEFINITIONS, getStripePlans, getPriceId, getPlanIdByPriceId };
