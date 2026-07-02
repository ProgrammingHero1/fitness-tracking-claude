const { ALL_GYM_STATUSES, ALL_SUBSCRIPTION_STATUSES } = require('shared/src/constants');

module.exports = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'slug', 'ownerUserId', 'status', 'inviteCode', 'subscription'],
    properties: {
      _id: { bsonType: 'objectId' },
      name: { bsonType: 'string' },
      slug: { bsonType: 'string' },
      ownerUserId: { bsonType: 'objectId' },
      status: { enum: ALL_GYM_STATUSES },
      timezone: { bsonType: 'string' },
      inviteCode: { bsonType: 'string' },
      stripeCustomerId: { bsonType: ['string', 'null'] },
      subscription: {
        bsonType: 'object',
        required: ['status'],
        properties: {
          status: { enum: ALL_SUBSCRIPTION_STATUSES },
          planId: { bsonType: ['string', 'null'] },
          stripeSubscriptionId: { bsonType: ['string', 'null'] },
          currentPeriodEnd: { bsonType: ['date', 'null'] },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};
