function scopeToGym(req, res, next) {
  const userGymId = req.authUser?.gymId;

  if (!userGymId) {
    return res.status(403).json({ error: 'No gym associated with this account' });
  }

  const requestedGymId = req.params.gymId || req.body?.gymId || req.query?.gymId;
  if (requestedGymId && requestedGymId !== userGymId) {
    return res.status(403).json({ error: 'Gym mismatch' });
  }

  req.gymId = userGymId;
  next();
}

module.exports = scopeToGym;
