const express = require('express');
const classService = require('../../services/classService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const includeCanceled = req.query.includeCanceled === 'true';
    const classes = await classService.listClasses(req.gymId, { includeCanceled });
    res.json({ classes });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, instructorName, startTime, endTime, capacity } = req.body || {};
    if (!title || !instructorName || !startTime || !endTime || !capacity) {
      return res
        .status(400)
        .json({ error: 'title, instructorName, startTime, endTime, and capacity are required' });
    }

    const createdClass = await classService.createClass(req.gymId, {
      title,
      instructorName,
      startTime,
      endTime,
      capacity,
      createdBy: req.authUser.id,
    });
    res.status(201).json({ class: createdClass });
  } catch (err) {
    next(err);
  }
});

router.get('/:classId', async (req, res, next) => {
  try {
    const classDoc = await classService.getClass(req.gymId, req.params.classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json({ class: classDoc });
  } catch (err) {
    next(err);
  }
});

router.patch('/:classId', async (req, res, next) => {
  try {
    const updated = await classService.updateClass(req.gymId, req.params.classId, req.body || {});
    if (!updated) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json({ class: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/:classId/cancel', async (req, res, next) => {
  try {
    const canceled = await classService.cancelClass(req.gymId, req.params.classId);
    if (!canceled) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json({ class: canceled });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
