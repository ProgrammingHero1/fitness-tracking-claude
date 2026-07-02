const { BOOKING_STATUSES, CLASS_STATUSES } = require('shared/src/constants');
const { getDb } = require('../db/connection');
const classService = require('./classService');
const HttpError = require('../utils/httpError');
const toObjectId = require('../utils/toObjectId');

async function getClassOrThrow(gymId, classId) {
  toObjectId(classId, 'classId'); // format check up front so a bad id 400s instead of 500ing
  const classDoc = await classService.getClass(gymId, classId);
  if (!classDoc) {
    throw new HttpError('Class not found', 404);
  }
  return classDoc;
}

async function countActiveBookings(gymId, classId) {
  const db = await getDb();
  return db.collection('bookings').countDocuments({
    gymId: toObjectId(gymId, 'gymId'),
    classId: toObjectId(classId, 'classId'),
    status: BOOKING_STATUSES.BOOKED,
  });
}

// Bookings are unique on {gymId, classId, userId} regardless of status, so a
// cancel-then-rebook flips an existing doc's status rather than inserting a new one.
async function bookClass(gymId, classId, userId) {
  const db = await getDb();
  const classDoc = await getClassOrThrow(gymId, classId);

  if (classDoc.status === CLASS_STATUSES.CANCELED) {
    throw new HttpError('Class is canceled', 409);
  }

  const gymObjectId = toObjectId(gymId, 'gymId');
  const userObjectId = toObjectId(userId, 'userId');

  const existing = await db.collection('bookings').findOne({
    gymId: gymObjectId,
    classId: classDoc._id,
    userId: userObjectId,
  });

  if (existing?.status === BOOKING_STATUSES.BOOKED) {
    throw new HttpError('Already booked', 409);
  }

  const activeCount = await countActiveBookings(gymId, classDoc._id);
  if (activeCount >= classDoc.capacity) {
    throw new HttpError('Class is full', 409);
  }

  const bookedAt = new Date();

  if (existing) {
    await db
      .collection('bookings')
      .updateOne({ _id: existing._id }, { $set: { status: BOOKING_STATUSES.BOOKED, bookedAt } });
    return { ...existing, status: BOOKING_STATUSES.BOOKED, bookedAt };
  }

  const doc = {
    gymId: gymObjectId,
    classId: classDoc._id,
    userId: userObjectId,
    status: BOOKING_STATUSES.BOOKED,
    bookedAt,
  };

  try {
    const result = await db.collection('bookings').insertOne(doc);
    return { _id: result.insertedId, ...doc };
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError('Already booked', 409);
    }
    throw err;
  }
}

async function cancelBooking(gymId, classId, userId) {
  const db = await getDb();

  const updated = await db.collection('bookings').findOneAndUpdate(
    {
      gymId: toObjectId(gymId, 'gymId'),
      classId: toObjectId(classId, 'classId'),
      userId: toObjectId(userId, 'userId'),
      status: BOOKING_STATUSES.BOOKED,
    },
    { $set: { status: BOOKING_STATUSES.CANCELED } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new HttpError('Active booking not found', 404);
  }

  return updated;
}

async function listBookingsForUser(gymId, userId, { status } = {}) {
  const db = await getDb();
  const filter = {
    gymId: toObjectId(gymId, 'gymId'),
    userId: toObjectId(userId, 'userId'),
  };
  if (status) {
    filter.status = status;
  }
  return db.collection('bookings').find(filter).sort({ bookedAt: -1 }).toArray();
}

// Upcoming classes for a gym, annotated with this member's booking state.
async function listUpcomingClassesForMember(gymId, userId) {
  const db = await getDb();
  const gymObjectId = toObjectId(gymId, 'gymId');
  const userObjectId = toObjectId(userId, 'userId');

  return db
    .collection('classes')
    .aggregate([
      { $match: { gymId: gymObjectId, status: CLASS_STATUSES.SCHEDULED, startTime: { $gte: new Date() } } },
      { $sort: { startTime: 1 } },
      {
        $lookup: {
          from: 'bookings',
          let: { classId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$classId', '$$classId'] },
                gymId: gymObjectId,
                status: BOOKING_STATUSES.BOOKED,
              },
            },
          ],
          as: 'activeBookings',
        },
      },
      {
        $addFields: {
          bookedCount: { $size: '$activeBookings' },
          isBookedByMe: { $in: [userObjectId, '$activeBookings.userId'] },
        },
      },
      { $project: { activeBookings: 0 } },
    ])
    .toArray();
}

module.exports = {
  bookClass,
  cancelBooking,
  listBookingsForUser,
  listUpcomingClassesForMember,
};
