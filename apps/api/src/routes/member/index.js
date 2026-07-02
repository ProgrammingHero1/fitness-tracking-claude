const express = require('express');
const statusRoutes = require('./status.routes');
const classesRoutes = require('./classes.routes');
const checkinRoutes = require('./checkin.routes');

const router = express.Router();

router.use(statusRoutes);
router.use(classesRoutes);
router.use(checkinRoutes);

module.exports = router;
