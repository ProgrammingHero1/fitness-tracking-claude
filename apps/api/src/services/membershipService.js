const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connection');
const { getAuth } = require('../auth/betterAuth');
const { MEMBERSHIP_STATUSES, PAYMENT_STATUSES } = require('shared/src/constants');

function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

async function inviteMember(gymId, { email, name, planName }) {
  const db = await getDb();
  const auth = await getAuth();
  const tempPassword = generateTempPassword();

  // signUpEmail's public schema has role/gymId as input:false (defaults to "member"/null) -
  // same pattern as scripts/seedPlatformAdmin.js: create via better-auth, then set gymId directly.
  const { user } = await auth.api.signUpEmail({ body: { email, password: tempPassword, name } });
  await db
    .collection('users')
    .updateOne({ _id: new ObjectId(user.id) }, { $set: { gymId: new ObjectId(gymId) } });

  const membership = {
    gymId: new ObjectId(gymId),
    userId: new ObjectId(user.id),
    planName,
    status: MEMBERSHIP_STATUSES.ACTIVE,
    paymentStatus: PAYMENT_STATUSES.UNPAID,
    joinedAt: new Date(),
  };
  await db.collection('memberships').insertOne(membership);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    tempPassword,
    membership,
  };
}

async function listMembers(gymId, { includeInactive = false } = {}) {
  const db = await getDb();
  const match = { gymId: new ObjectId(gymId) };
  if (!includeInactive) {
    match.status = MEMBERSHIP_STATUSES.ACTIVE;
  }

  return db
    .collection('memberships')
    .aggregate([
      { $match: match },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $sort: { joinedAt: -1 } },
      {
        $project: {
          userId: 1,
          planName: 1,
          status: 1,
          paymentStatus: 1,
          joinedAt: 1,
          'user.email': 1,
          'user.name': 1,
        },
      },
    ])
    .toArray();
}

async function getMembership(gymId, userId) {
  const db = await getDb();
  return db
    .collection('memberships')
    .findOne({ gymId: new ObjectId(gymId), userId: new ObjectId(userId) });
}

async function updateMembership(gymId, userId, updates) {
  const db = await getDb();
  const allowed = {};
  if (updates.planName !== undefined) allowed.planName = updates.planName;
  if (updates.paymentStatus !== undefined) allowed.paymentStatus = updates.paymentStatus;
  if (updates.status !== undefined) allowed.status = updates.status;

  if (Object.keys(allowed).length === 0) {
    return getMembership(gymId, userId);
  }

  return db
    .collection('memberships')
    .findOneAndUpdate(
      { gymId: new ObjectId(gymId), userId: new ObjectId(userId) },
      { $set: allowed },
      { returnDocument: 'after' }
    );
}

async function softDeleteMembership(gymId, userId) {
  return updateMembership(gymId, userId, { status: MEMBERSHIP_STATUSES.INACTIVE });
}

module.exports = {
  inviteMember,
  listMembers,
  getMembership,
  updateMembership,
  softDeleteMembership,
};
