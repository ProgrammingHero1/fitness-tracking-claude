const express = require('express');
const { ALL_GYM_STATUSES } = require('shared/src/constants');
const gymService = require('../../services/gymService');
const toObjectId = require('../../utils/toObjectId');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const gyms = await gymService.listGyms();
    res.json({ gyms });
  } catch (err) {
    next(err);
  }
});

router.get('/:gymId', async (req, res, next) => {
  try {
    toObjectId(req.params.gymId, 'gymId');
    const gym = await gymService.getGymById(req.params.gymId);
    if (!gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }
    res.json({ gym });
  } catch (err) {
    next(err);
  }
});

router.patch('/:gymId/status', async (req, res, next) => {
  try {
    toObjectId(req.params.gymId, 'gymId');
    const { status } = req.body || {};
    if (!ALL_GYM_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALL_GYM_STATUSES.join(', ')}` });
    }

    const gym = await gymService.updateGymStatus(req.params.gymId, status);
    if (!gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }
    res.json({ gym });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
