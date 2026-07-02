const { ObjectId } = require('mongodb');
const HttpError = require('./httpError');

function toObjectId(value, label = 'id') {
  if (!ObjectId.isValid(String(value))) {
    throw new HttpError(`Invalid ${label}`, 400);
  }
  return new ObjectId(String(value));
}

module.exports = toObjectId;
