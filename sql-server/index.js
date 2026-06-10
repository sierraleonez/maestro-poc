require('dotenv').config();
const express = require('express');
const routes = require('./routes');

const app = express();
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400)
      console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode}`, { payload: req.body, response: body });
    return originalJson(body);
  };
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(routes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
