module.exports = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['gymId', 'userId', 'checkedInAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      gymId: { bsonType: 'objectId' },
      userId: { bsonType: 'objectId' },
      classId: { bsonType: ['objectId', 'null'] },
      checkedInAt: { bsonType: 'date' },
    },
    additionalProperties: false,
  },
};
