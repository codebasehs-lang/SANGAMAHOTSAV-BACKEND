const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Registration } = require('../models');
const { Op } = require('sequelize');
const smsRepository = require('./sms.repository');

test('findDonationOnlyRecipients queries any registration with a donation item, no attendance/payment filter', async (t) => {
  const findAll = t.mock.method(Registration, 'findAll', async () => []);

  await smsRepository.findDonationOnlyRecipients();

  const { where } = findAll.mock.calls[0].arguments[0];
  assert.deepEqual(where, { donationItems: { [Op.ne]: null } });
});

test('findDonationOnlyRecipients filters by ids when provided', async (t) => {
  const findAll = t.mock.method(Registration, 'findAll', async () => []);

  await smsRepository.findDonationOnlyRecipients([3, 4]);

  const { where } = findAll.mock.calls[0].arguments[0];
  assert.deepEqual(where, {
    donationItems: { [Op.ne]: null },
    id: { [Op.in]: [3, 4] },
  });
});

test('findNotStayingRecipients queries by non_attending_type only, no payment filter', (t) => {
  const findAll = t.mock.method(Registration, 'findAll', async () => []);

  smsRepository.findNotStayingRecipients();

  const { where } = findAll.mock.calls[0].arguments[0];
  assert.deepEqual(where, { non_attending_type: 'ATTENDING_NOT_STAYING' });
});

test('findNotStayingRecipients filters by ids when provided', (t) => {
  const findAll = t.mock.method(Registration, 'findAll', async () => []);

  smsRepository.findNotStayingRecipients([3, 4]);

  const { where } = findAll.mock.calls[0].arguments[0];
  assert.deepEqual(where, {
    non_attending_type: 'ATTENDING_NOT_STAYING',
    id: { [Op.in]: [3, 4] },
  });
});
