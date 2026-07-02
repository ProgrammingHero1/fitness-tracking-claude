function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.authUser || !allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = requireRole;
