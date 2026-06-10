function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {}
}

sleep(2000);

const response = http.post('http://localhost:3000/sumsub/upload-all-docs', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: output.env.EMAIL, country: output.env.COUNTRY }),
});
