const ROLES = Object.freeze({
  PLATFORM_ADMIN: 'platformAdmin',
  GYM_ADMIN: 'gymAdmin',
  MEMBER: 'member',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ALL_ROLES };
