const { ObjectId, Int32 } = require('mongodb');
const { getDb } = require('../db/connection');
const { CLASS_STATUSES, BOOKING_STATUSES } = require('shared/src/constants');

async function createClass(gymId, { title, instructorName, startTime, endTime, capacity, createdBy }) {
  const db = await getDb();
  const doc = {
    gymId: new ObjectId(gymId),
    title,
    instructorName,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    // The classes.schema.js validator requires bsonType 'int'; the native driver stores plain
    // JS numbers as BSON doubles, so capacity must be wrapped to satisfy validation.
    capacity: new Int32(capacity),
    status: CLASS_STATUSES.SCHEDULED,
    createdBy: new ObjectId(createdBy),
  };

  const result = await db.collection('classes').insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function listClasses(gymId, { includeCanceled = false } = {}) {
  const db = await getDb();
  const filter = { gymId: new ObjectId(gymId) };
  if (!includeCanceled) {
    filter.status = { $ne: CLASS_STATUSES.CANCELED };
  }

  return db.collection('classes').find(filter).sort({ startTime: 1 }).toArray();
}

async function getClass(gymId, classId) {
  const db = await getDb();
  return db.collection('classes').findOne({ _id: new ObjectId(classId), gymId: new ObjectId(gymId) });
}

async function updateClass(gymId, classId, updates) {
  const db = await getDb();
  const allowed = {};
  if (updates.title !== undefined) allowed.title = updates.title;
  if (updates.instructorName !== undefined) allowed.instructorName = updates.instructorName;
  if (updates.capacity !== undefined) allowed.capacity = new Int32(updates.capacity);
  if (updates.startTime !== undefined) allowed.startTime = new Date(updates.startTime);
  if (updates.endTime !== undefined) allowed.endTime = new Date(updates.endTime);

  if (Object.keys(allowed).length === 0) {
    return getClass(gymId, classId);
  }

  return db
    .collection('classes')
    .findOneAndUpdate(
      { _id: new ObjectId(classId), gymId: new ObjectId(gymId) },
      { $set: allowed },
      { returnDocument: 'after' }
    );
}

async function cancelClass(gymId, classId) {
  const db = await getDb();
  const gymObjectId = new ObjectId(gymId);
  const classObjectId = new ObjectId(classId);

  const canceled = await db
    .collection('classes')
    .findOneAndUpdate(
      { _id: classObjectId, gymId: gymObjectId },
      { $set: { status: CLASS_STATUSES.CANCELED } },
      { returnDocument: 'after' }
    );

  if (!canceled) {
    return null;
  }

  // Cascade: a canceled class can't be attended, so its outstanding bookings are canceled too.
  await db
    .collection('bookings')
    .updateMany(
      { gymId: gymObjectId, classId: classObjectId, status: BOOKING_STATUSES.BOOKED },
      { $set: { status: BOOKING_STATUSES.CANCELED } }
    );

  return canceled;
}

module.exports = { createClass, listClasses, getClass, updateClass, cancelClass };
