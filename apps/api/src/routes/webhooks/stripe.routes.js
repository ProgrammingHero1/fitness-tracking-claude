const express = require('express');
const { ObjectId } = require('mongodb');
const { SUBSCRIPTION_STATUSES } = require('shared/src/constants');
const { getDb } = require('../../db/connection');
const gymService = require('../../services/gymService');
const stripeService = require('../../services/stripeService');
const { getPlanIdByPriceId } = require('../../config/stripePlans');

const router = express.Router();

const HANDLED_EVENT_TYPES = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
]);

// Mounted with express.raw() - Stripe signature verification needs the exact unparsed body.
router.post('/', express.raw({ type: 'application/json' }), async (req, res, next) => {
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, req.headers['stripe-signature']);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    const gymId = await resolveGymId(event);
    if (!gymId) {
      return res.status(200).json({ received: true, skipped: true });
    }

    const db = await getDb();
    try {
      await db.collection('billingEvents').insertOne({
        gymId,
        stripeEventId: event.id,
        type: event.type,
        payload: event.data.object,
        receivedAt: new Date(),
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate delivery of an event we already processed - ack without reapplying.
        return res.status(200).json({ received: true, duplicate: true });
      }
      throw err;
    }

    if (HANDLED_EVENT_TYPES.has(event.type)) {
      await applySubscriptionUpdate(gymId, event);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

async function resolveGymId(event) {
  const object = event.data.object || {};

  if (object.metadata?.gymId) {
    return new ObjectId(object.metadata.gymId);
  }

  const customerId = typeof object.customer === 'string' ? object.customer : object.customer?.id;
  if (customerId) {
    const gym = await gymService.getGymByStripeCustomerId(customerId);
    if (gym) {
      return gym._id;
    }
  }

  return null;
}

async function applySubscriptionUpdate(gymId, event) {
  const object = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const subscriptionId =
        typeof object.subscription === 'string' ? object.subscription : object.subscription?.id;
      if (!subscriptionId) break;
      const subscription = await stripeService.getStripeClient().subscriptions.retrieve(subscriptionId);
      await syncSubscription(gymId, subscription);
      break;
    }
    case 'customer.subscription.updated':
      await syncSubscription(gymId, object);
      break;
    case 'customer.subscription.deleted':
      await gymService.updateSubscription(gymId, {
        status: SUBSCRIPTION_STATUSES.CANCELED,
        stripeSubscriptionId: object.id,
      });
      break;
    case 'invoice.payment_failed':
      await gymService.updateSubscription(gymId, { status: SUBSCRIPTION_STATUSES.PAST_DUE });
      break;
    default:
      break;
  }
}

async function syncSubscription(gymId, subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planId = priceId ? getPlanIdByPriceId(priceId) : null;

  await gymService.updateSubscription(gymId, {
    status: mapStripeStatus(subscription.status),
    planId,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
  });
}

function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'trialing':
      return SUBSCRIPTION_STATUSES.TRIALING;
    case 'active':
      return SUBSCRIPTION_STATUSES.ACTIVE;
    case 'past_due':
    case 'unpaid':
      return SUBSCRIPTION_STATUSES.PAST_DUE;
    default:
      // canceled, incomplete_expired, etc. - no active access.
      return SUBSCRIPTION_STATUSES.CANCELED;
  }
}

module.exports = router;
