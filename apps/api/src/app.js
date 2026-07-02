const express = require('express');
const { toNodeHandler } = require('better-auth/node');
const { getAuth } = require('./auth/betterAuth');
const errorHandler = require('./middleware/errorHandler');

let appPromise;

function createApp() {
  if (!appPromise) {
    appPromise = getAuth().then((auth) => {
      const app = express();

      // Must be mounted before express.json() - better-auth reads the raw request stream itself.
      app.all('/api/auth/*', toNodeHandler(auth));

      app.use(express.json());

      app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
      });

      app.use(errorHandler);

      return app;
    });
  }
  return appPromise;
}

module.exports = { createApp };
