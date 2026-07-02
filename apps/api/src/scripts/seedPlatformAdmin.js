require('dotenv').config();

const { ObjectId } = require('mongodb');
const { ROLES } = require('shared/src/roles');
const { getAuth } = require('../auth/betterAuth');
const { getDb } = require('../db/connection');

async function run() {
  const email = process.env.PLATFORM_ADMIN_EMAIL;
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  const name = process.env.PLATFORM_ADMIN_NAME || 'Platform Admin';

  if (!email || !password) {
    throw new Error('PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD must be set in the environment.');
  }

  const db = await getDb();
  const existing = await db.collection('users').findOne({ email });
  if (existing) {
    console.log(`Platform admin already exists: ${email} (role: ${existing.role})`);
    process.exit(0);
  }

  const auth = await getAuth();
  // role/gymId are input:false on the public schema, so sign-up always creates a "member" - promote it directly after.
  const { user } = await auth.api.signUpEmail({ body: { email, password, name } });
  await db.collection('users').updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { role: ROLES.PLATFORM_ADMIN } }
  );

  console.log(`Platform admin created: ${email} (id: ${user.id})`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to seed platform admin:', err);
  process.exit(1);
});
