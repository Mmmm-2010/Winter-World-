import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));

const SYSTEM_PROMPT = `You are Winter Companion, a warm, practical, age-appropriate assistant inside a winter-themed website. The user may be a teenager. Be friendly but not overly intimate. Help with study planning, creative ideas, hobbies, winter activities, simple organization, and positive encouragement. Keep answers concise, clear, and actionable. Match the user's requested language (Uzbek, Russian, or English). Do not ask for passwords, addresses, phone numbers, or other private information. Do not provide sexual content, dangerous challenges, instructions for harmful acts, or graphic violence. Do not act as a therapist or diagnose conditions; if the user describes serious distress, respond supportively and encourage speaking with a trusted adult or qualified professional. Never claim to have performed actions outside this chat. If asked for current facts, explain that you may not have live information.`;

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'winter-companion' }));
app.post('/api/companion/chat', async (req, res) => {
  const { message, history = [], language = 'en', name = '' } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Please enter a message.' });
  if (message.length > 1200) return res.status(400).json({ error: 'Message is too long (maximum 1,200 characters).' });
  if (!Array.isArray(history) || history.length > 10) return res.status(400).json({ error: 'Invalid conversation history.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured yet. Add OPENAI_API_KEY to the server .env file, then restart the backend.' });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const safeHistory = history
      .filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
      .slice(-10)
      .map(item => ({ role: item.role, content: item.content.slice(0, 1200) }));
    const languageName = ({ uz: 'Uzbek', ru: 'Russian', en: 'English' })[language] || 'English';
    const userContext = `Reply in ${languageName}. ${name ? `The user's preferred name is ${name.slice(0, 40)}.` : ''} Current request: ${message.trim()}`;
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 650,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...safeHistory,
        { role: 'user', content: userContext }
      ]
    });
    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'The AI returned an empty response. Please try again.' });
    res.json({ reply });
  } catch (error) {
    console.error('Companion API error:', error?.status || error?.message || 'Unknown error');
    if (error?.status === 401) return res.status(502).json({ error: 'The AI key was rejected. Check OPENAI_API_KEY in server .env.' });
    if (error?.status === 429) return res.status(429).json({ error: 'The AI service is busy or its usage limit was reached. Try again later.' });
    res.status(502).json({ error: 'The AI service could not respond. Please try again in a moment.' });
  }
});

app.listen(PORT, () => console.log(`Winter Companion API running at http://localhost:${PORT}`));
