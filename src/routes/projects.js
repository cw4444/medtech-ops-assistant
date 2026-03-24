const { Router } = require('express');
const store = require('../services/store');
const ai = require('../services/ai');

const router = Router();
const COLLECTION = 'projects';

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

// AI: Break down a project into tasks
router.post('/ai/breakdown', async (req, res) => {
  const { projectName, description, deadline, teamSize, notes } = req.body;
  const system = `You are a project manager for a MedTech startup. You create practical, actionable project breakdowns
with realistic timelines. You understand clinical, regulatory, and commercial workstreams.`;
  const prompt = `Break down this project into tasks:
- Project: ${projectName}
- Description: ${description}
- Deadline: ${deadline || 'TBD'}
- Team size: ${teamSize || '2-5'}
- Notes: ${notes || 'None'}

Provide: work breakdown structure, task dependencies, priority levels (P0-P3), estimated effort per task, milestones, and risk flags. Format as structured markdown with a summary table.`;
  const result = await ai.ask(system, prompt);
  res.json({ breakdown: result });
});

// AI: Weekly status report
router.post('/ai/status-report', async (req, res) => {
  const { projectName, completedThisWeek, plannedNextWeek, blockers, notes } = req.body;
  const system = `You are a project manager who writes concise, professional weekly status reports for startup founders and stakeholders.`;
  const prompt = `Generate a weekly status report:
- Project: ${projectName}
- Completed this week: ${completedThisWeek}
- Planned next week: ${plannedNextWeek}
- Blockers: ${blockers || 'None'}
- Notes: ${notes || 'None'}

Format: Executive summary (2-3 sentences), completed items, upcoming items, risks & blockers, and key decisions needed.`;
  const result = await ai.ask(system, prompt);
  res.json({ report: result });
});

module.exports = router;
