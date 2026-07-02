module.exports = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['gymId', 'stripeEventId', 'type', 'payload', 'receivedAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      gymId: { bsonType: 'objectId' },
      stripeEventId: { bsonType: 'string' },
      type: { bsonType: 'string' },
      payload: { bsonType: 'object' },
      receivedAt: { bsonType: 'date' },
    },
    additionalProperties: false,
  },
};
