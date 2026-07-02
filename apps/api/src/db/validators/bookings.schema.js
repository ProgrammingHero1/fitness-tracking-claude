const { ALL_BOOKING_STATUSES } = require('shared/src/constants');

module.exports = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['gymId', 'classId', 'userId', 'status', 'bookedAt'],
    properties: {
      gymId: { bsonType: 'objectId' },
      classId: { bsonType: 'objectId' },
      userId: { bsonType: 'objectId' },
      status: { enum: ALL_BOOKING_STATUSES },
      bookedAt: { bsonType: 'date' },
    },
    additionalProperties: false,
  },
};
