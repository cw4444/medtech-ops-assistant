const { Router } = require('express');
const store = require('../services/store');
const ai = require('../services/ai');

const router = Router();
const COLLECTION = 'clinical-trials';

// List all trials
router.get('/', (req, res) => {
  res.json(store.load(COLLECTION));
});

// Create a trial
router.post('/', (req, res) => {
  const trial = store.add(COLLECTION, req.body);
  res.status(201).json(trial);
});

// Update a trial
router.patch('/:id', (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Trial not found' });
  res.json(updated);
});

// Delete a trial
router.delete('/:id', (req, res) => {
  store.remove(COLLECTION, req.params.id);
  res.status(204).end();
});

// AI: Generate a clinical study plan
router.post('/ai/study-plan', async (req, res) => {
  const { trialName, indication, phase, sites, notes } = req.body;
  const system = `You are a clinical operations expert specialising in MedTech and medical device trials.
You understand UK MHRA regulations, EU MDR, FDA 510(k)/PMA pathways, and NHS clinical trial processes.
Output structured, actionable study plans in markdown.`;
  const prompt = `Generate a comprehensive clinical study plan for:
- Trial name: ${trialName}
- Indication: ${indication}
- Phase: ${phase}
- Number of sites: ${sites || 'TBD'}
- Additional notes: ${notes || 'None'}

Include: objectives, study design, endpoints, timeline with milestones, regulatory requirements, site management plan, data management approach, and risk mitigation strategies.`;
  const result = await ai.ask(system, prompt);
  res.json({ plan: result });
});

// AI: Generate a protocol synopsis
router.post('/ai/protocol-synopsis', async (req, res) => {
  const { trialName, indication, phase, deviceDescription, notes } = req.body;
  const system = `You are a medical writer specialising in clinical trial protocol documents for MedTech companies.`;
  const prompt = `Draft a protocol synopsis for:
- Trial: ${trialName}
- Indication: ${indication}
- Phase: ${phase}
- Device: ${deviceDescription}
- Notes: ${notes || 'None'}

Include all standard ICH-GCP sections: title, objectives, background, study design, population, endpoints, statistical considerations, safety reporting, and ethical considerations.`;
  const result = await ai.ask(system, prompt);
  res.json({ synopsis: result });
});

module.exports = router;
