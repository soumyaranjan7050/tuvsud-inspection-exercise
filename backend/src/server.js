const express = require('express');
const cors = require('cors');
const inspectionsRouter = require('./routes/inspections');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/inspections', inspectionsRouter);
  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 4000;
  createApp().listen(port, () => {
    console.log(`TÜV SÜD inspection API listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };
