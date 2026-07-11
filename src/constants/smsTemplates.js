const { SMS_CAMPAIGN_TYPE } = require('./enums');

/**
 * SMS message templates keyed by campaign type.
 * Placeholders use {{token}} syntax and are filled by the SMS service.
 *
 * Available tokens: name, hotelName, hotelAddress, roomNumber,
 * hotelMap, hallName, hallAddress, hallMap.
 */
const TEMPLATES = Object.freeze({
  [SMS_CAMPAIGN_TYPE.ACCOMMODATION]: [
    'Hare Krishna',
    '',
    'Dear {{name}}',
    '',
    'Your accommodation has been confirmed.',
    '',
    'Hotel: {{hotelName}}',
    'Address: {{hotelAddress}}',
    'Room Number: {{roomNumber}}',
    'Hotel Map: {{hotelMap}}',
    '',
    'Seminar Hall: {{hallName}}',
    'Seminar Hall Map: {{hallMap}}',
    '',
    'Sangamahotsav Team',
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
 * Renders a template by replacing {{token}} placeholders.
 * Missing tokens resolve to an empty string.
 */
function renderTemplate(template, data = {}) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    data[key] != null ? String(data[key]) : ''
  );
}

module.exports = { TEMPLATES, renderTemplate };
