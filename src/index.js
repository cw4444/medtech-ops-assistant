const express = require('express');
const path = require('path');
const config = require('./config');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/clinical', require('./routes/clinical'));
app.use('/api/regulatory', require('./routes/regulatory'));
app.use('/api/grants', require('./routes/grants'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/stakeholders', require('./routes/stakeholders'));
app.use('/api/events', require('./routes/events'));
app.use('/api/presentations', require('./routes/presentations'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(config.port, () => {
  console.log(`MedTech Ops Assistant running on http://localhost:${config.port}`);
});
