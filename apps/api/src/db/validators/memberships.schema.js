const { ALL_MEMBERSHIP_STATUSES, ALL_PAYMENT_STATUSES } = require('shared/src/constants');

module.exports = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['gymId', 'userId', 'planName', 'status', 'paymentStatus', 'joinedAt'],
    properties: {
      gymId: { bsonType: 'objectId' },
      userId: { bsonType: 'objectId' },
      planName: { bsonType: 'string' },
      status: { enum: ALL_MEMBERSHIP_STATUSES },
      paymentStatus: { enum: ALL_PAYMENT_STATUSES },
      joinedAt: { bsonType: 'date' },
    },
    additionalProperties: false,
  },
};
