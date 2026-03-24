const { Router } = require('express');
const ai = require('../services/ai');

const router = Router();

// AI: Generate presentation outline
router.post('/ai/outline', async (req, res) => {
  const { topic, audience, duration, keyMessages, notes } = req.body;
  const system = `You are a presentation strategist for a MedTech startup. You create compelling narratives
for investors, NHS partners, academic collaborators (MIT, Harvard), and conference audiences.`;
  const prompt = `Create a presentation outline for:
- Topic: ${topic}
- Audience: ${audience}
- Duration: ${duration || '15 minutes'}
- Key messages: ${keyMessages}
- Notes: ${notes || 'None'}

Provide: slide-by-slide outline with suggested content, speaker notes for each slide, data/evidence to include, design recommendations, and Q&A preparation.`;
  const result = await ai.ask(system, prompt);
  res.json({ outline: result });
});

// AI: Generate talking points
router.post('/ai/talking-points', async (req, res) => {
  const { context, audience, keyObjectives, notes } = req.body;
  const system = `You are a communications coach for healthcare startup founders presenting to high-profile audiences.`;
  const prompt = `Generate talking points for:
- Context: ${context}
- Audience: ${audience}
- Key objectives: ${keyObjectives}
- Notes: ${notes || 'None'}

Include: opening hook, 3-5 key talking points with supporting evidence, anticipated questions with suggested answers, and a strong closing statement.`;
  const result = await ai.ask(system, prompt);
  res.json({ talkingPoints: result });
});

module.exports = router;
