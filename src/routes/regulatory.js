const { Router } = require('express');
const store = require('../services/store');
const ai = require('../services/ai');

const router = Router();
const COLLECTION = 'regulatory';

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

// AI: Generate regulatory strategy
router.post('/ai/strategy', async (req, res) => {
  const { deviceName, classification, targetMarkets, deviceDescription, notes } = req.body;
  const system = `You are a regulatory affairs expert for medical devices and MedTech.
You have deep knowledge of MHRA, EU MDR 2017/745, FDA 21 CFR, and international regulatory pathways.
Provide structured, actionable regulatory strategies in markdown.`;
  const prompt = `Create a regulatory strategy for:
- Device: ${deviceName}
- Classification: ${classification || 'To be determined'}
- Target markets: ${targetMarkets || 'UK, EU, US'}
- Description: ${deviceDescription}
- Notes: ${notes || 'None'}

Include: classification rationale, pathway selection per market, essential requirements/GSPR mapping, standards to meet (IEC 62304, ISO 14971, IEC 62366, etc.), timeline, submission milestones, and post-market surveillance plan.`;
  const result = await ai.ask(system, prompt);
  res.json({ strategy: result });
});

// AI: Gap analysis
router.post('/ai/gap-analysis', async (req, res) => {
  const { deviceName, currentStatus, targetSubmission, notes } = req.body;
  const system = `You are a regulatory affairs consultant specialising in gap analyses for MedTech regulatory submissions.`;
  const prompt = `Perform a regulatory gap analysis for:
- Device: ${deviceName}
- Current status: ${currentStatus}
- Target submission: ${targetSubmission}
- Notes: ${notes || 'None'}

Identify gaps in: technical documentation, clinical evidence, quality management system, risk management, biocompatibility, software lifecycle, usability, labelling, and post-market requirements. For each gap, provide severity, recommendation, and estimated effort.`;
  const result = await ai.ask(system, prompt);
  res.json({ analysis: result });
});

module.exports = router;
