const { test } = require('node:test');
const assert = require('node:assert/strict');
const registrationRepository = require('../repositories/registration.repository');
const registrationService = require('./registration.service');

test('attendance summary includes registrants and checked-in family members', async (t) => {
  t.mock.method(registrationRepository, 'findAllForAttendanceSummary', async () => [
    {
      attendanceStatus: 'PARTIALLY_ARRIVED',
      familyMembers: [{ name: 'Arrived member', checkedIn: true }, { name: 'Not arrived member' }],
    },
    {
      attendanceStatus: 'NOT_ARRIVED',
      familyMembers: [{ name: 'Another member', checkedIn: false }],
    },
    {
      attendanceStatus: 'CHECKED_OUT',
      familyMembers: null,
    },
  ]);

  const result = await registrationService.getAttendanceSummary();

  assert.deepEqual(result, {
    totalDevotees: 6,
    checkedIn: 3,
    byStatus: { NOT_ARRIVED: 1, PARTIALLY_ARRIVED: 1, CHECKED_IN: 0, CHECKED_OUT: 1 },
  });
});

test('reset attendance clears registration and family attendance and key status', async (t) => {
  const registration = {
    id: 4,
    attendanceStatus: 'CHECKED_OUT',
    checkedInAt: new Date(),
    checkedInBy: 2,
    checkedOutAt: new Date(),
    checkedOutBy: 3,
    hotelKeyGiven: true,
    hotelKeyGivenAt: new Date(),
    hotelKeyGivenBy: 2,
    hotelKeyReturned: true,
    hotelKeyReturnedAt: new Date(),
    hotelKeyReturnedBy: 3,
    familyMembers: [{
      name: 'Family member',
      giftGiven: true,
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy: 2,
      checkedOut: true,
      checkedOutAt: new Date(),
      checkedOutBy: 3,
    }],
  };
  const originalFamilyMembers = registration.familyMembers;
  t.mock.method(registrationRepository, 'findByIdWithAssignment', async () => registration);
  const update = t.mock.method(registrationRepository, 'update', async (_id, values) => {
    Object.assign(registration, values);
  });

  const result = await registrationService.updateAttendance(
    registration.id,
    { action: 'RESET', memberIndexes: [999] },
    7
  );

  assert.equal(update.mock.callCount(), 1);
  assert.equal(result.attendanceStatus, 'NOT_ARRIVED');
  assert.equal(result.checkedInAt, null);
  assert.equal(result.checkedInBy, null);
  assert.equal(result.checkedOutAt, null);
  assert.equal(result.checkedOutBy, null);
  assert.equal(result.hotelKeyGiven, false);
  assert.equal(result.hotelKeyGivenAt, null);
  assert.equal(result.hotelKeyGivenBy, null);
  assert.equal(result.hotelKeyReturned, false);
  assert.equal(result.hotelKeyReturnedAt, null);
  assert.equal(result.hotelKeyReturnedBy, null);
  assert.equal(result.familyMembers[0].giftGiven, true);
  for (const field of [
    'checkedIn', 'checkedInAt', 'checkedInBy',
    'checkedOut', 'checkedOutAt', 'checkedOutBy',
  ]) {
    assert.equal(Object.hasOwn(result.familyMembers[0], field), false);
  }
  assert.equal(originalFamilyMembers[0].checkedIn, true);
});
