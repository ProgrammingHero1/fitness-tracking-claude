const express = require('express');
const checkinService = require('../../services/checkinService');

const router = express.Router();

// General check-in when body.classId is omitted, per-class check-in when it's present.
router.post('/checkin', async (req, res, next) => {
  try {
    const checkin = await checkinService.checkIn(req.gymId, req.authUser.id, req.body?.classId ?? null);
    res.status(201).json({ checkin });
  } catch (err) {
    next(err);
  }
});

router.get('/checkin/history', async (req, res, next) => {
  try {
    const checkins = await checkinService.listCheckinsForUser(req.gymId, req.authUser.id);
    res.json({ checkins });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
