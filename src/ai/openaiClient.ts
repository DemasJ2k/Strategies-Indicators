import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('[Flowrex AI] OPENAI_API_KEY is not set. /assistant/chat will fail.');
}

export const openai = new OpenAI({
  apiKey,
});
