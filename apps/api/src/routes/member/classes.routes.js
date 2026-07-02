const express = require('express');
const bookingService = require('../../services/bookingService');

const router = express.Router();

router.get('/classes', async (req, res, next) => {
  try {
    const classes = await bookingService.listUpcomingClassesForMember(req.gymId, req.authUser.id);
    res.json({ classes });
  } catch (err) {
    next(err);
  }
});

router.post('/classes/:classId/book', async (req, res, next) => {
  try {
    const booking = await bookingService.bookClass(req.gymId, req.params.classId, req.authUser.id);
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

router.post('/classes/:classId/cancel', async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.gymId, req.params.classId, req.authUser.id);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
