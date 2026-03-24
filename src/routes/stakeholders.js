const { Router } = require('express');
const store = require('../services/store');
const ai = require('../services/ai');

const router = Router();
const COLLECTION = 'stakeholders';

router.get('/', (req, res) => res.json(store.load(COLLECTION)));
router.post('/', (req, res) => res.status(201).json(store.add(COLLECTION, req.body)));
router.patch('/:id', (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});
router.delete('/:id', (req, res) => {
  store.remove(COLLECTION, req.params.id);
  res.status(204).end();
});

// AI: Draft stakeholder communication
router.post('/ai/draft-comms', async (req, res) => {
  const { stakeholderName, organisation, context, purpose, tone } = req.body;
  const system = `You are a communications specialist for a MedTech startup that works with the NHS, MIT, Harvard,
and other prestigious institutions. You draft professional, strategic communications.`;
  const prompt = `Draft a communication for:
- Stakeholder: ${stakeholderName}
- Organisation: ${organisation}
- Context: ${context}
- Purpose: ${purpose}
- Tone: ${tone || 'Professional and collaborative'}

Provide the draft email/message and suggest follow-up actions and timing.`;
  const result = await ai.ask(system, prompt);
  res.json({ draft: result });
});

// AI: Stakeholder mapping
router.post('/ai/mapping', async (req, res) => {
  const { projectContext, stakeholderList, notes } = req.body;
  const system = `You are a stakeholder management expert who creates power/interest grids and engagement strategies.`;
  const prompt = `Create a stakeholder map for:
- Project context: ${projectContext}
- Known stakeholders: ${stakeholderList}
- Notes: ${notes || 'None'}

Provide: power/interest categorisation for each stakeholder, engagement strategy per category, communication frequency recommendations, and risk of disengagement flags.`;
  const result = await ai.ask(system, prompt);
  res.json({ mapping: result });
});

module.exports = router;
