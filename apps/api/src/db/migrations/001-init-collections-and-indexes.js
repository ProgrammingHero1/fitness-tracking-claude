require('dotenv').config();

const { getDb } = require('../connection');
const usersSchema = require('../validators/users.schema');
const gymsSchema = require('../validators/gyms.schema');
const membershipsSchema = require('../validators/memberships.schema');
const classesSchema = require('../validators/classes.schema');
const bookingsSchema = require('../validators/bookings.schema');
const checkinsSchema = require('../validators/checkins.schema');
const billingEventsSchema = require('../validators/billingEvents.schema');

const COLLECTIONS = [
  {
    name: 'users',
    validator: usersSchema,
    indexes: [[{ gymId: 1, role: 1 }, {}]],
  },
  {
    name: 'gyms',
    validator: gymsSchema,
    indexes: [
      [{ slug: 1 }, { unique: true }],
      [{ stripeCustomerId: 1 }, { unique: true, sparse: true }],
      [{ 'subscription.status': 1 }, {}],
    ],
  },
  {
    name: 'memberships',
    validator: membershipsSchema,
    indexes: [[{ gymId: 1, userId: 1 }, { unique: true }]],
  },
  {
    name: 'classes',
    validator: classesSchema,
    indexes: [[{ gymId: 1, startTime: 1 }, {}]],
  },
  {
    name: 'bookings',
    validator: bookingsSchema,
    indexes: [[{ gymId: 1, classId: 1, userId: 1 }, { unique: true }]],
  },
  {
    name: 'checkins',
    validator: checkinsSchema,
    indexes: [[{ gymId: 1, userId: 1, checkedInAt: -1 }, {}]],
  },
  {
    name: 'billingEvents',
    validator: billingEventsSchema,
    indexes: [[{ stripeEventId: 1 }, { unique: true }]],
  },
];

async function ensureCollection(db, name, validator) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(name, { validator, validationLevel: 'moderate' });
    console.log(`Created collection: ${name}`);
  } else {
    await db.command({ collMod: name, validator, validationLevel: 'moderate' });
    console.log(`Updated validator: ${name}`);
  }
}

async function run() {
  const db = await getDb();

  for (const { name, validator, indexes } of COLLECTIONS) {
    await ensureCollection(db, name, validator);
    for (const [keys, options] of indexes) {
      await db.collection(name).createIndex(keys, options);
    }
    console.log(`Indexes ensured: ${name}`);
  }

  console.log('Migration complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
