// Stub for F10 - replaced with real Stripe-status gating in Track A (A7).
function checkGymSubscriptionActive(req, res, next) {
  next();
}

module.exports = checkGymSubscriptionActive;
