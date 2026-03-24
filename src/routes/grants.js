const { Router } = require('express');
const store = require('../services/store');
const ai = require('../services/ai');

const router = Router();
const COLLECTION = 'grants';

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

// AI: Draft a grant proposal
router.post('/ai/draft', async (req, res) => {
  const { grantBody, fundingAmount, projectTitle, projectSummary, teamBackground, notes } = req.body;
  const system = `You are an expert grant writer specialising in UK and global MedTech/healthtech funding.
You know UKRI, Innovate UK, NIHR, Horizon Europe, Wellcome Trust, Bill & Melinda Gates Foundation, and similar bodies.
Write compelling, structured proposals that score highly against standard assessment criteria.`;
  const prompt = `Draft a grant proposal for:
- Funding body: ${grantBody}
- Requested amount: ${fundingAmount || 'TBD'}
- Project title: ${projectTitle}
- Project summary: ${projectSummary}
- Team background: ${teamBackground || 'Early-stage MedTech startup'}
- Notes: ${notes || 'None'}

Include: executive summary, need/problem statement, innovation & approach, work packages with deliverables, impact & dissemination plan, team & capabilities, value for money, risk register, and a Gantt chart outline.`;
  const result = await ai.ask(system, prompt);
  res.json({ proposal: result });
});

// AI: Strengthen existing text
router.post('/ai/strengthen', async (req, res) => {
  const { text, grantBody, criteria } = req.body;
  const system = `You are a grant writing consultant who improves proposal sections to maximise scores against funder criteria.`;
  const prompt = `Improve this grant text for ${grantBody || 'a UK funding body'}:

"""
${text}
"""

Assessment criteria to optimise for: ${criteria || 'Innovation, impact, feasibility, value for money'}

Return the improved text with inline comments explaining key changes.`;
  const result = await ai.ask(system, prompt);
  res.json({ improved: result });
});

module.exports = router;
