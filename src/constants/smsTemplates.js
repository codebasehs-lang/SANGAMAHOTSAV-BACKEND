const { SMS_CAMPAIGN_TYPE } = require('./enums');

/**
 * SMS message templates keyed by campaign type.
 * Placeholders use {{token}} syntax and are filled by the SMS service.
 *
 * Available tokens: name, amount, accommodation, devoteeText, hotelName,
 * hotelAddress, roomNumber, hotelMap, hallName, hallAddress, hallMap.
 */
const TEMPLATES = Object.freeze({
  [SMS_CAMPAIGN_TYPE.PAYMENT_CONFIRMED]: [
    '🌸 Hare Krishna! 🙏',
    '',
    'Please accept our humble obeisances.',
    '',
    'Dear {{name}},',
    '',
    'Your registration for Sanga Mahotsav 2026 is successfully confirmed.',
    '',
    'We have received ₹{{amount}}/- towards {{accommodation}} accommodation for {{devoteeText}}.',
    '',
    'We look forward to welcoming you for this auspicious gathering and wonderful devotional association.',
    '',
    '🏠 Accommodation and event details will be shared shortly.',
    '',
    '🙏 Your Servants,',
    'Sanga Mahotsav Management Committee',
  ].join('\n'),

  [SMS_CAMPAIGN_TYPE.REMINDER_7_DAY]: [
    'Hare Krishna {{name}}',
    '',
    'Reminder: Sangamahotsav begins in 7 days.',
    '',
    'Seminar Hall: {{hallName}}',
    'Map: {{hallMap}}',
    '',
    'We look forward to your presence.',
    'Sangamahotsav Team',
  ].join('\n'),

  [SMS_CAMPAIGN_TYPE.REMINDER_2_DAY]: [
    'Hare Krishna {{name}}',
    '',
    'Reminder: Sangamahotsav begins in 2 days.',
    '',
    'Hotel: {{hotelName}}, Room: {{roomNumber}}',
    'Hotel Map: {{hotelMap}}',
    '',
    'Seminar Hall: {{hallName}}',
    'Map: {{hallMap}}',
    '',
    'Sangamahotsav Team',
  ].join('\n'),
});

/**
 * Numbered placeholders {{1}}-{{7}} matching the approved Meta template
 * "seminar_details_room_full_message":
 *   1=name, 2=hotelName, 3=hotelAddress, 4=roomNumber, 5=hotelMap,
 *   6=hallName, 7=hallMap.
 */
const ACCOMMODATION_CONFIRMATION_TEMPLATE = [
  '*Hare Krishna!*',
  '',
  'Please accept our humble obeisances.',
  '',
  'Dear *{{1}}*,',
  '',
  'Your accommodation for *Sanga Mahotsav 2026* has been confirmed.',
  '',
  '*Hotel Details*',
  'Hotel: {{2}}',
  'Address: {{3}}',
  'Room Number: {{4}}',
  'Hotel Map: {{5}}',
  '',
  '*Seminar Hall Details*',
  'Hall: {{6}}',
  'Seminar Hall Map: {{7}}',
  '',
  'We kindly request you to report directly to your allotted accommodation upon arrival and join the seminar sessions as per the event schedule.',
  '',
  '*Important Notes:*',
  '- Your *Seminar Entry Wristband* will be kept in your hotel room.',
  '- Please carry your *Aadhaar Card (or a valid government-issued photo ID)* for hotel check-in.',
  '- If any payment towards your registration is still pending, kindly complete it at the earliest to avoid any inconvenience.',
  '',
  'We pray that your stay and participation in *Sanga Mahotsav 2026* will be comfortable, inspiring, and spiritually enriching.',
  '',
  '*Your Servants,*',
  '*Sanga Mahotsav Management Committee* 🙏🏻',
].join('\n');

const NOT_STAYING_CONFIRMATION_TEMPLATE = [
  '*Hare Krishna!*',
  '',
  'Please accept our humble obeisances.',
  '',
  'Dear *{{1}}*,',
  '',
  'Your registration for *Sanga Mahotsav 2026* has been confirmed.',
  '',
  '*Seminar Hall Details*',
  'Hall: *{{2}}*',
  'Map: *{{3}}*',
  '',
  'We look forward to your participation in the seminar sessions and pray for a spiritually enriching experience.',
  '',
  '*Your Servants,*',
  '*Sanga Mahotsav Management Committee*',
].join('\n');

const DONATION_THANK_YOU_TEMPLATE = [
  '*Hare Krishna! 🙏*',
  '',
  'Dear *{{1}}*,',
  '',
  'Thank you for your generous donation towards *Sanga Mahotsav 2026*. Your support is greatly appreciated and helps make this festival possible.',
  '',
  'We pray for the blessings of Sri Sri Krishna Balaram upon you and your family.',
  '',
  '*Sanga Mahotsav Management Committee* 🙏',
].join('\n');

/**
 * Renders a template by replacing {{token}} placeholders.
 * Missing tokens resolve to an empty string.
 */
function renderTemplate(template, data = {}) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    data[key] != null ? String(data[key]) : ''
  );
}

module.exports = {
  TEMPLATES,
  ACCOMMODATION_CONFIRMATION_TEMPLATE,
  NOT_STAYING_CONFIRMATION_TEMPLATE,
  DONATION_THANK_YOU_TEMPLATE,
  renderTemplate,
};

