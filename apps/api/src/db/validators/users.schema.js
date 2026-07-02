const { ALL_ROLES } = require('shared/src/roles');

module.exports = {
  $jsonSchema: {
    bsonType: 'object',
    properties: {
      role: { enum: ALL_ROLES },
      gymId: { bsonType: ['objectId', 'null'] },
    },
    additionalProperties: true,
  },
};
