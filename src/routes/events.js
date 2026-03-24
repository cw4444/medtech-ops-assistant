const { Router } = require('express');
const store = require('../services/store');
const ai = require('../services/ai');

const router = Router();
const COLLECTION = 'events';

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

// AI: Event planning checklist
router.post('/ai/plan', async (req, res) => {
  const { eventName, eventType, date, audience, budget, notes } = req.body;
  const system = `You are an event coordinator for a MedTech startup, experienced in webinars, conferences, NHS engagement events, and investor showcases.`;
  const prompt = `Create an event plan for:
- Event: ${eventName}
- Type: ${eventType || 'Webinar'}
- Date: ${date || 'TBD'}
- Target audience: ${audience}
- Budget: ${budget || 'Limited startup budget'}
- Notes: ${notes || 'None'}

Include: objectives, run-of-show, speaker prep checklist, marketing timeline, tech requirements, attendee engagement strategy, follow-up plan, and success metrics.`;
  const result = await ai.ask(system, prompt);
  res.json({ plan: result });
});

module.exports = router;
