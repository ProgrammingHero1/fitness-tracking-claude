const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { ObjectId } = require('mongodb');
const { ROLES } = require('shared/src/roles');
const { getDb, getClientPromise } = require('../db/connection');

let authPromise;

function getAuth() {
  if (!authPromise) {
    authPromise = Promise.all([getDb(), getClientPromise()]).then(([db, client]) =>
      betterAuth({
        database: mongodbAdapter(db, { client, usePlural: true }),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        // Browsers only ever call same-origin /api/* on the Next.js host (proxied to Express),
        // so that's the origin better-auth's CSRF-style origin check needs to trust.
        trustedOrigins: [process.env.APP_BASE_URL],
        emailAndPassword: {
          enabled: true,
        },
        user: {
          additionalFields: {
            role: {
              type: 'string',
              required: true,
              input: false,
              defaultValue: ROLES.MEMBER,
            },
            gymId: {
              type: 'string',
              required: false,
              input: false,
              defaultValue: null,
              // stored as a real ObjectId in Mongo (matches gyms._id / F7's validator); string at the API boundary, like better-auth's own id fields
              transform: {
                input: (value) => (value == null ? null : new ObjectId(String(value))),
                output: (value) => (value == null ? null : value.toString()),
              },
            },
          },
        },
      })
    );
  }
  return authPromise;
}

module.exports = { getAuth };
