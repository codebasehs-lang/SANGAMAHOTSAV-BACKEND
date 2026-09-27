const { test } = require('node:test');
const assert = require('node:assert/strict');
const smsRepository = require('../repositories/sms.repository');
const seminarHallService = require('./seminarHall.service');
const env = require('../config/env');
const whatsappClient = require('../utils/whatsappCloudClient');

const sentMessages = [];
whatsappClient.sendWhatsapp = async (payload) => {
  sentMessages.push(payload);
  return { success: true, providerMessageId: 'test-message' };
};
const smsService = require('./sms.service');

const registration = { id: 3, name: 'Attendee', mobileNumber: '9000000003' };
const hall = { id: 5, hallName: 'Main Hall', hallMapLink: 'https://example.org/hall' };

function mockSending(t) {
  sentMessages.length = 0;
  t.mock.method(seminarHallService, 'getActive', async () => hall);
  const findRecipients = t.mock.method(
    smsRepository, 'findRecipients', async () => [registration]
  );
  const findDonationRecipients = t.mock.method(
    smsRepository, 'findDonationOnlyRecipients', async () => []
  );
  const findNotStayingRecipients = t.mock.method(
    smsRepository, 'findNotStayingRecipients', async () => []
  );
  const createCampaign = t.mock.method(
    smsRepository, 'createCampaign', async () => ({ id: 10 })
  );
  t.mock.method(smsRepository, 'createLog', async () => {});
  t.mock.method(smsRepository, 'updateCampaign', async () => {});
  return { findRecipients, findDonationRecipients, findNotStayingRecipients, createCampaign };
}

test('Any Devotee sends donation template only to selected registration', async (t) => {
  const previous = env.whatsapp.donationTemplateName;
  env.whatsapp.donationTemplateName = 'donation_thank_you';
  t.after(() => { env.whatsapp.donationTemplateName = previous; });
  const mocks = mockSending(t);

  const result = await smsService.sendCampaign({
    type: 'DONATION', channel: 'WHATSAPP', recipientMode: 'ANY_DEVOTEE',
    registrationIds: [3],
  }, 1);

  assert.equal(result.totalRecipients, 1);
  assert.deepEqual(mocks.findRecipients.mock.calls[0].arguments, [[3]]);
  assert.equal(mocks.findDonationRecipients.mock.callCount(), 0);
  assert.equal(sentMessages[0].templateName, 'donation_thank_you');
  assert.equal(sentMessages[0].components[0].parameters[0].text, 'Attendee');
});

test('Any Devotee sends non-staying template without category restriction', async (t) => {
  const previous = env.whatsapp.notStayingTemplateName;
  env.whatsapp.notStayingTemplateName = 'not_staying';
  t.after(() => { env.whatsapp.notStayingTemplateName = previous; });
  const mocks = mockSending(t);

  const result = await smsService.sendCampaign({
    type: 'NOT_STAYING', channel: 'WHATSAPP', recipientMode: 'ANY_DEVOTEE',
    registrationIds: [3],
  }, 1);

  assert.equal(result.sentCount, 1);
  assert.equal(mocks.findNotStayingRecipients.mock.callCount(), 0);
  assert.equal(sentMessages[0].templateName, 'not_staying');
  assert.deepEqual(
    sentMessages[0].components[0].parameters.map(({ text }) => text),
    ['Attendee', 'Main Hall', 'https://example.org/hall']
  );
});

test('Any Devotee sends accommodation template without room assignment', async (t) => {
  const mocks = mockSending(t);
  const result = await smsService.sendCampaign({
    type: 'ACCOMMODATION', channel: 'WHATSAPP', recipientMode: 'ANY_DEVOTEE',
    registrationIds: [3],
  }, 1);
  assert.equal(result.totalRecipients, 1);
  assert.equal(mocks.createCampaign.mock.callCount(), 1);
  assert.equal(sentMessages.length, 1);
});

test('Any Devotee rejects empty and missing selections without broadcasting', async (t) => {
  const mocks = mockSending(t);
  const findAll = t.mock.method(smsRepository, 'findAllRecipients', async () => []);
  await assert.rejects(
    smsService.sendCampaign({
      type: 'CUSTOM', channel: 'WHATSAPP', message: 'Hello',
      recipientMode: 'ANY_DEVOTEE', registrationIds: [],
    }, 1),
    /Select at least one devotee/
  );
  await assert.rejects(
    smsService.sendCampaign({
      type: 'CUSTOM', channel: 'WHATSAPP', message: 'Hello',
      recipientMode: 'ANY_DEVOTEE', registrationIds: [3, 4],
    }, 1),
    /could not be found/
  );
  assert.equal(findAll.mock.callCount(), 0);
  assert.equal(mocks.createCampaign.mock.callCount(), 0);
});

test('Application notice rejects Any Devotee mode before creating campaign', async (t) => {
  const mocks = mockSending(t);
  await assert.rejects(
    smsService.sendCampaign({
      type: 'CUSTOM', channel: 'APPLICATION', message: 'Hello',
      recipientMode: 'ANY_DEVOTEE', registrationIds: [3],
    }, 1),
    /Application notices are visible to everyone/
  );
  assert.equal(mocks.createCampaign.mock.callCount(), 0);
});

test('Donation category campaign fetches any donor regardless of attendance or payment status', async (t) => {
  const previous = env.whatsapp.donationTemplateName;
  env.whatsapp.donationTemplateName = 'donation_thank_you';
  t.after(() => { env.whatsapp.donationTemplateName = previous; });
  t.mock.method(seminarHallService, 'getActive', async () => hall);
  const findDonationRecipients = t.mock.method(
    smsRepository, 'findDonationOnlyRecipients', async () => [registration]
  );
  t.mock.method(smsRepository, 'createCampaign', async () => ({ id: 10 }));
  t.mock.method(smsRepository, 'createLog', async () => {});
  t.mock.method(smsRepository, 'updateCampaign', async () => {});

  const result = await smsService.sendCampaign({
    type: 'DONATION', channel: 'WHATSAPP', registrationIds: [3],
  }, 1);

  assert.equal(result.totalRecipients, 1);
  assert.deepEqual(findDonationRecipients.mock.calls[0].arguments, [[3]]);
});

test('Non-staying category campaign fetches any matching devotee regardless of payment status', async (t) => {
  const previous = env.whatsapp.notStayingTemplateName;
  env.whatsapp.notStayingTemplateName = 'not_staying';
  t.after(() => { env.whatsapp.notStayingTemplateName = previous; });
  t.mock.method(seminarHallService, 'getActive', async () => hall);
  const findNotStayingRecipients = t.mock.method(
    smsRepository, 'findNotStayingRecipients', async () => [registration]
  );
  t.mock.method(smsRepository, 'createCampaign', async () => ({ id: 10 }));
  t.mock.method(smsRepository, 'createLog', async () => {});
  t.mock.method(smsRepository, 'updateCampaign', async () => {});

  const result = await smsService.sendCampaign({
    type: 'NOT_STAYING', channel: 'WHATSAPP', registrationIds: [3],
  }, 1);

  assert.equal(result.totalRecipients, 1);
  assert.deepEqual(findNotStayingRecipients.mock.calls[0].arguments, [[3]]);
});
