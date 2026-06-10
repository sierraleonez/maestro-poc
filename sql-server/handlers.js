const { Pool } = require('pg');
const FormData = require('form-data');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const sumsub = {
  appToken: process.env.SUMSUB_APP_TOKEN,
  appSecret: process.env.SUMSUB_APP_SECRET,
  baseUrl: 'https://api.sumsub.com',
};

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function getApplicantId(req, res) {
  const { rows } = await pool.query(
    'SELECT applicant_id FROM registrations WHERE email = $1',
    [req.query.email]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ applicant_id: rows[0].applicant_id });
}

async function getOtp(req, res) {
  const { rows } = await pool.query(
    'SELECT code FROM otp_verifications WHERE email = $1',
    [req.query.email]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ code: rows[0].code });
}

const DOCS_DIR = path.join(__dirname, 'sumsub_docs');

function resolveDocPath(docPath) {
  const dir = path.join(DOCS_DIR, docPath);
  const files = fs.readdirSync(dir);
  const imageFile = files.find(f => f !== 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8'));
  const image = fs.readFileSync(path.join(dir, imageFile));
  return { metadata, image, filename: imageFile };
}

async function fetchApplicantId(email) {
  const { rows } = await pool.query(
    'SELECT applicant_id FROM registrations WHERE email = $1',
    [email]
  );
  return rows[0]?.applicant_id ?? null;
}

function buildIdDocForm(docPath) {
  const { metadata, image, filename } = resolveDocPath(docPath);
  const form = new FormData();
  form.append('metadata', JSON.stringify(metadata), { contentType: 'application/json' });
  form.append('content', image, { filename });
  return form;
}

async function sumsubDocUpload(applicantId, form) {
  const urlPath = `/resources/applicants/${applicantId}/info/idDoc`;
  const method = 'POST';
  const timestamp = Math.floor(Date.now() / 1000);
  const formBuffer = form.getBuffer();

  const signature = crypto
    .createHmac('sha256', sumsub.appSecret)
    .update(Buffer.concat([
      Buffer.from(timestamp.toString()),
      Buffer.from(method),
      Buffer.from(urlPath),
      formBuffer,
    ]))
    .digest('hex');

  const response = await fetch(`${sumsub.baseUrl}${urlPath}`, {
    method,
    body: formBuffer,
    headers: {
      ...form.getHeaders(),
      'X-App-Token': sumsub.appToken,
      'X-App-Access-Ts': timestamp,
      'X-App-Access-Sig': signature,
      'X-Return-Doc-Warnings': 'true',
    },
  });

  return { status: response.status, data: await response.json() };
}

async function uploadIdDoc(req, res) {
  const { email, docPath } = req.body;

  if (!docPath)
    return res.status(400).json({ error: 'docPath is required (e.g. "ID_CARD/China/Front")' });

  const applicantId = await fetchApplicantId(email);
  if (!applicantId) return res.status(404).json({ error: 'Not found' });

  const form = buildIdDocForm(docPath);
  const { status, data } = await sumsubDocUpload(applicantId, form);

  res.status(status).json(data);
}

const DOC_SEQUENCE = (country) => [
  'selfie',
  `ID_CARD/${country}/Front`,
  `ID_CARD/${country}/Back`,
];

async function uploadAllDocs(req, res) {
  const { email, country } = req.body;

  console.log(email, country)
  if (!country) return res.status(400).json({ error: 'country is required' });

  const applicantId = await fetchApplicantId(email);
  if (!applicantId) return res.status(404).json({ error: 'Not found' });

  const results = [];
  for (const docPath of DOC_SEQUENCE(country)) {
    const form = buildIdDocForm(docPath);
    const { status, data } = await sumsubDocUpload(applicantId, form);
    if (status >= 400) return res.status(status).json({ docPath, ...data });
    results.push({ docPath, ...data });
  }
  res.json(results);
}

const hashAnswer = (str) => crypto.createHash('sha256').update(str).digest('hex').slice(0, 10);

async function getAnswerList(req, res) {
  const { region } = req.query;
  const response = await fetch(
    `https://api-dev.valutrades.io/api/v1/user/general/questionnaires/available-questionnaires?region_id=${region}`
  );
  const { data } = await response.json();
  const result = data.map(({ id, answers }) => {
    const best = answers.reduce((a, b) => (Number(b.score) > Number(a.score) ? b : a));
    return { id, answer: hashAnswer(best.answer) };
  });
  res.json(result);
}

module.exports = { getApplicantId, getOtp, uploadIdDoc, uploadAllDocs, getAnswerList };
