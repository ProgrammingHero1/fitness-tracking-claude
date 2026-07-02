const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { GYM_STATUSES, SUBSCRIPTION_STATUSES } = require('shared/src/constants');
const { getDb } = require('../db/connection');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateInviteCode() {
  return crypto.randomBytes(5).toString('hex');
}

// Slugs are unique; append a short random suffix on collision and retry a few times.
async function createGym({ name, ownerUserId, timezone }) {
  const db = await getDb();
  const base = slugify(name) || 'gym';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${crypto.randomBytes(2).toString('hex')}`;
    const doc = {
      name,
      slug,
      ownerUserId: new ObjectId(String(ownerUserId)),
      status: GYM_STATUSES.ACTIVE,
      timezone: timezone || 'UTC',
      inviteCode: generateInviteCode(),
      stripeCustomerId: null,
      subscription: {
        status: SUBSCRIPTION_STATUSES.CANCELED,
        planId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
      },
    };

    try {
      const { insertedId } = await db.collection('gyms').insertOne(doc);
      return { ...doc, _id: insertedId };
    } catch (err) {
      if (err.code === 11000 && attempt < 4) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to generate a unique gym slug');
}

async function listGyms() {
  const db = await getDb();
  return db.collection('gyms').find().sort({ name: 1 }).toArray();
}

async function getGymById(gymId) {
  const db = await getDb();
  return db.collection('gyms').findOne({ _id: new ObjectId(String(gymId)) });
}

async function getGymBySlug(slug) {
  const db = await getDb();
  return db.collection('gyms').findOne({ slug });
}

async function getGymByStripeCustomerId(stripeCustomerId) {
  const db = await getDb();
  return db.collection('gyms').findOne({ stripeCustomerId });
}

async function updateGymStatus(gymId, status) {
  const db = await getDb();
  const result = await db
    .collection('gyms')
    .findOneAndUpdate(
      { _id: new ObjectId(String(gymId)) },
      { $set: { status } },
      { returnDocument: 'after' }
    );
  return result;
}

async function setStripeCustomerId(gymId, stripeCustomerId) {
  const db = await getDb();
  const result = await db
    .collection('gyms')
    .findOneAndUpdate(
      { _id: new ObjectId(String(gymId)) },
      { $set: { stripeCustomerId } },
      { returnDocument: 'after' }
    );
  return result;
}

async function updateSubscription(gymId, subscriptionPatch) {
  const db = await getDb();
  const $set = Object.fromEntries(
    Object.entries(subscriptionPatch).map(([key, value]) => [`subscription.${key}`, value])
  );
  const result = await db
    .collection('gyms')
    .findOneAndUpdate({ _id: new ObjectId(String(gymId)) }, { $set }, { returnDocument: 'after' });
  return result;
}

module.exports = {
  createGym,
  listGyms,
  getGymById,
  getGymBySlug,
  getGymByStripeCustomerId,
  updateGymStatus,
  setStripeCustomerId,
  updateSubscription,
};
