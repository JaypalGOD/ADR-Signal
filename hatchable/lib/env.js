import { config } from 'hatchable';

const KEYS = ['GEMINI_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'];

// Optional secrets from hatchable.toml as a process.env-shaped object for lib/core.js. Unset ones are undefined.
export async function secrets() {
  const values = await Promise.all(KEYS.map(k => config.get(k).catch(() => null)));
  return Object.fromEntries(KEYS.map((k, i) => [k, values[i] || undefined]));
}
