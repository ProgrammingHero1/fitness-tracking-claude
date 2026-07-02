const express = require('express');
const { ObjectId } = require('mongodb');
const { ROLES } = require('shared/src/roles');
const { getDb } = require('../../db/connection');
const gymService = require('../../services/gymService');

const router = express.Router();

router.post('/create-gym', async (req, res, next) => {
  try {
    const { authUser } = req;

    if (authUser.gymId || authUser.role !== ROLES.MEMBER) {
      return res.status(409).json({ error: 'This account is already associated with a gym' });
    }

    const { gymName, timezone } = req.body || {};
    if (!gymName || typeof gymName !== 'string' || !gymName.trim()) {
      return res.status(400).json({ error: 'gymName is required' });
    }

    const gym = await gymService.createGym({
      name: gymName.trim(),
      ownerUserId: authUser.id,
      timezone,
    });

    const db = await getDb();
    await db
      .collection('users')
      .updateOne({ _id: new ObjectId(authUser.id) }, { $set: { role: ROLES.GYM_ADMIN, gymId: gym._id } });

    res.status(201).json({
      gym: {
        ...gym,
        _id: gym._id.toString(),
        ownerUserId: gym.ownerUserId.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
