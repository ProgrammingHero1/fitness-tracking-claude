const { ALL_CLASS_STATUSES } = require('shared/src/constants');

module.exports = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['gymId', 'title', 'instructorName', 'startTime', 'endTime', 'capacity', 'status'],
    properties: {
      _id: { bsonType: 'objectId' },
      gymId: { bsonType: 'objectId' },
      title: { bsonType: 'string' },
      instructorName: { bsonType: 'string' },
      startTime: { bsonType: 'date' },
      endTime: { bsonType: 'date' },
      capacity: { bsonType: 'int', minimum: 1 },
      status: { enum: ALL_CLASS_STATUSES },
      createdBy: { bsonType: 'objectId' },
    },
    additionalProperties: false,
  },
};
