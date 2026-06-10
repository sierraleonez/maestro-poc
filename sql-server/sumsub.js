const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const config = {
  appToken: 'YOUR_APP_TOKEN',
  appSecret: 'YOUR_APP_SECRET',
  baseUrl: 'https://api.sumsub.com'
};

/**
 * Uploads ID document to Sumsub
 * @param {string} applicantId 
 * @param {object} metadata - e.g. { idDocType: 'PASSPORT', country: 'IDN' }
 * @param {string} filePath - Absolute or relative path to file
 */
async function uploadIdDoc(applicantId, metadata, filePath) {
  const urlPath = `/resources/applicants/${applicantId}/info/idDoc`;
  const method = 'POST';
  const timestamp = Math.floor(Date.now() / 1000);

  // 1. Prepare Multipart Form
  const form = new FormData();
  
  // Sumsub expects 'metadata' as a JSON string part
  form.append('metadata', JSON.stringify(metadata || {}), {
    contentType: 'application/json'
  });

  // Append the file
  const fileStream = fs.createReadStream(filePath);
  form.append('content', fileStream);

  // 2. Generate Signature
  // Note: Sumsub signature is ts + method + path + body
  // We must get the full buffer to sign it correctly
  const formBuffer = form.getBuffer();
  
  const dataToSign = Buffer.concat([
    Buffer.from(timestamp.toString()),
    Buffer.from(method.toUpperCase()),
    Buffer.from(urlPath),
    formBuffer
  ]);

  const signature = crypto
    .createHmac('sha256', config.appSecret)
    .update(dataToSign)
    .digest('hex');

  // 3. Execute Request
  try {
    const response = await axios({
      method,
      url: `${config.baseUrl}${urlPath}`,
      data: formBuffer,
      headers: {
        ...form.getHeaders(),
        'X-App-Token': config.appToken,
        'X-App-Access-Ts': timestamp,
        'X-App-Access-Sig': signature,
        'X-Return-Doc-Warnings': 'true'
      }
    });

    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`❌ Error ${status}:`, errorData || error.message);
    throw error;
  }
}

// Example Usage:
// uploadIdDoc('65a...id', { idDocType: 'SELFIE' }, './path/to/image.jpg');

const ID_DOC_TYPE = {
    idCard: 'ID_CARD',
}