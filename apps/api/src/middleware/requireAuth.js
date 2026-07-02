const { fromNodeHeaders } = require('better-auth/node');
const { getAuth } = require('../auth/betterAuth');

async function requireAuth(req, res, next) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.authUser = session.user;
    req.session = session.session;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
