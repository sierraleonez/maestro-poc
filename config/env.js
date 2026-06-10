const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);

output.env = {
  EMAIL: `maestro_${timestamp}@gmail.com`,
  LIVE_PASSWORD: 'Password123!',
  FIRST_NAME: 'Maestro',
  LAST_NAME: 'Agent',
  DATE_OF_BIRTH: '14/02/1990',
  PHONE_NUMBER: '1234567890',
  HOUSE_NUMBER: '123',
  STREET: 'Main Street',
  CITY: 'London',
  POSTAL_CODE: 'SW1A 1AA',
  COUNTRY: 'Vietnam',
  REGION: 'Valutrades Seychelles',
  REGION_ID: '3',
  CAPTCHA: '1245',
  PASSWORD: 'Password123!',
  ACCOUNT_NUMBER: '30060113',
  DUPLICATE_EMAIL: 'lesley_duplicate@yopmail.com',
  REGISTERED_EMAIL: 'andika_language_thai@hirakirimail.com',
  REGISTERED_PASSWORD: 'Password123!'
};
