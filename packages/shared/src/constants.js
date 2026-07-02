const GYM_STATUSES = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
});

const ALL_GYM_STATUSES = Object.freeze(Object.values(GYM_STATUSES));

const SUBSCRIPTION_STATUSES = Object.freeze({
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
});

const ALL_SUBSCRIPTION_STATUSES = Object.freeze(Object.values(SUBSCRIPTION_STATUSES));

const MEMBERSHIP_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const ALL_MEMBERSHIP_STATUSES = Object.freeze(Object.values(MEMBERSHIP_STATUSES));

const PAYMENT_STATUSES = Object.freeze({
  PAID: 'paid',
  UNPAID: 'unpaid',
});

const ALL_PAYMENT_STATUSES = Object.freeze(Object.values(PAYMENT_STATUSES));

const CLASS_STATUSES = Object.freeze({
  SCHEDULED: 'scheduled',
  CANCELED: 'canceled',
});

const ALL_CLASS_STATUSES = Object.freeze(Object.values(CLASS_STATUSES));

const BOOKING_STATUSES = Object.freeze({
  BOOKED: 'booked',
  CANCELED: 'canceled',
});

const ALL_BOOKING_STATUSES = Object.freeze(Object.values(BOOKING_STATUSES));

module.exports = {
  GYM_STATUSES,
  ALL_GYM_STATUSES,
  SUBSCRIPTION_STATUSES,
  ALL_SUBSCRIPTION_STATUSES,
  MEMBERSHIP_STATUSES,
  ALL_MEMBERSHIP_STATUSES,
  PAYMENT_STATUSES,
  ALL_PAYMENT_STATUSES,
  CLASS_STATUSES,
  ALL_CLASS_STATUSES,
  BOOKING_STATUSES,
  ALL_BOOKING_STATUSES,
};
