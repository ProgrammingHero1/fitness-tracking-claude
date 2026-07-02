const { getDb } = require('../db/connection');
const HttpError = require('../utils/httpError');
const toObjectId = require('../utils/toObjectId');

async function checkIn(gymId, userId, classId = null) {
  const db = await getDb();
  const gymObjectId = toObjectId(gymId, 'gymId');
  const userObjectId = toObjectId(userId, 'userId');

  let classObjectId = null;
  if (classId) {
    classObjectId = toObjectId(classId, 'classId');
    const classDoc = await db.collection('classes').findOne({ _id: classObjectId, gymId: gymObjectId });
    if (!classDoc) {
      throw new HttpError('Class not found', 404);
    }
  }

  const doc = {
    gymId: gymObjectId,
    userId: userObjectId,
    classId: classObjectId,
    checkedInAt: new Date(),
  };

  const result = await db.collection('checkins').insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function listCheckinsForUser(gymId, userId, { limit = 50 } = {}) {
  const db = await getDb();
  return db
    .collection('checkins')
    .find({ gymId: toObjectId(gymId, 'gymId'), userId: toObjectId(userId, 'userId') })
    .sort({ checkedInAt: -1 })
    .limit(limit)
    .toArray();
}

module.exports = { checkIn, listCheckinsForUser };
