const { Router } = require('express');
const { getApplicantId, getOtp, uploadIdDoc, uploadAllDocs, getAnswerList } = require('./handlers');

const router = Router();

router.get('/applicant-id', getApplicantId);
router.get('/otp', getOtp);
router.get('/answer-list', getAnswerList);
router.post('/sumsub/upload-id-doc', uploadIdDoc);
router.post('/sumsub/upload-all-docs', uploadAllDocs);

module.exports = router;
