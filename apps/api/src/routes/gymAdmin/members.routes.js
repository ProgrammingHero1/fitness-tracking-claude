const express = require('express');
const membershipService = require('../../services/membershipService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const members = await membershipService.listMembers(req.gymId, { includeInactive });
    res.json({ members });
  } catch (err) {
    next(err);
  }
});

router.post('/invite', async (req, res, next) => {
  try {
    const { email, name, planName } = req.body || {};
    if (!email || !name || !planName) {
      return res.status(400).json({ error: 'email, name, and planName are required' });
    }

    const result = await membershipService.inviteMember(req.gymId, { email, name, planName });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:userId', async (req, res, next) => {
  try {
    const membership = await membershipService.updateMembership(req.gymId, req.params.userId, req.body || {});
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json({ membership });
  } catch (err) {
    next(err);
  }
});

router.delete('/:userId', async (req, res, next) => {
  try {
    const membership = await membershipService.softDeleteMembership(req.gymId, req.params.userId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json({ membership });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
