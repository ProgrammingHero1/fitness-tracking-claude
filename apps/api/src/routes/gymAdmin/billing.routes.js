const express = require('express');
const gymService = require('../../services/gymService');
const stripeService = require('../../services/stripeService');
const { getStripePlans } = require('../../config/stripePlans');

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    const gym = await gymService.getGymById(req.gymId);
    if (!gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    res.json({
      gymStatus: gym.status,
      subscription: gym.subscription,
      plans: getStripePlans(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/checkout-session', async (req, res, next) => {
  try {
    const { planId } = req.body || {};
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const gym = await gymService.getGymById(req.gymId);
    if (!gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    let customerId = gym.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        gymId: gym._id,
        email: req.authUser.email,
        name: gym.name,
      });
      customerId = customer.id;
      await gymService.setStripeCustomerId(gym._id, customerId);
    }

    const appBaseUrl = process.env.APP_BASE_URL;
    const session = await stripeService.createCheckoutSession({
      gymId: gym._id,
      customerId,
      planId,
      successUrl: `${appBaseUrl}/gym-admin/billing?checkout=success`,
      cancelUrl: `${appBaseUrl}/gym-admin/billing?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

router.post('/portal-session', async (req, res, next) => {
  try {
    const gym = await gymService.getGymById(req.gymId);
    if (!gym?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer on file for this gym yet' });
    }

    const appBaseUrl = process.env.APP_BASE_URL;
    const session = await stripeService.createPortalSession({
      customerId: gym.stripeCustomerId,
      returnUrl: `${appBaseUrl}/gym-admin/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
