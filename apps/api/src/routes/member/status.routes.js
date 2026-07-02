const express = require('express');
const membershipService = require('../../services/membershipService');

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    const membership = await membershipService.getMembership(req.gymId, req.authUser.id);

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    res.json({ membership });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
