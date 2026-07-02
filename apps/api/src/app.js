const express = require('express');
const { toNodeHandler } = require('better-auth/node');
const { ROLES } = require('shared/src/roles');
const { getAuth } = require('./auth/betterAuth');
const errorHandler = require('./middleware/errorHandler');
const requireAuth = require('./middleware/requireAuth');
const requireRole = require('./middleware/requireRole');
const scopeToGym = require('./middleware/scopeToGym');
const checkGymSubscriptionActive = require('./middleware/checkGymSubscriptionActive');
const gymAdminMembersRoutes = require('./routes/gymAdmin/members.routes');
const gymAdminClassesRoutes = require('./routes/gymAdmin/classes.routes');
const gymAdminOnboardingRoutes = require('./routes/gymAdmin/onboarding.routes');
const gymAdminBillingRoutes = require('./routes/gymAdmin/billing.routes');
const memberRoutes = require('./routes/member');
const platformAdminGymsRoutes = require('./routes/platformAdmin/gyms.routes');
const stripeWebhookRoutes = require('./routes/webhooks/stripe.routes');

let appPromise;

function createApp() {
  if (!appPromise) {
    appPromise = getAuth().then((auth) => {
      const app = express();

      // Must be mounted before express.json() - better-auth reads the raw request stream itself.
      app.all('/api/auth/*', toNodeHandler(auth));

      // Also before express.json() - Stripe signature verification needs the raw body.
      app.use('/api/webhooks/stripe', stripeWebhookRoutes);

      app.use(express.json());

      app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
      });

      app.use('/api/gym-admin/onboarding', requireAuth, gymAdminOnboardingRoutes);

      // No checkGymSubscriptionActive here - billing/portal must stay reachable regardless of subscription state.
      app.use(
        '/api/gym-admin/billing',
        requireAuth,
        requireRole([ROLES.GYM_ADMIN]),
        scopeToGym,
        gymAdminBillingRoutes
      );

      const gymAdminChain = [requireAuth, requireRole([ROLES.GYM_ADMIN]), scopeToGym, checkGymSubscriptionActive];
      app.use('/api/gym-admin/members', ...gymAdminChain, gymAdminMembersRoutes);
      app.use('/api/gym-admin/classes', ...gymAdminChain, gymAdminClassesRoutes);

      const memberChain = [requireAuth, requireRole([ROLES.MEMBER]), scopeToGym, checkGymSubscriptionActive];
      app.use('/api/member', ...memberChain, memberRoutes);

      const platformAdminChain = [requireAuth, requireRole([ROLES.PLATFORM_ADMIN])];
      app.use('/api/platform-admin/gyms', ...platformAdminChain, platformAdminGymsRoutes);

      app.use(errorHandler);

      return app;
    });
  }
  return appPromise;
}

module.exports = { createApp };
