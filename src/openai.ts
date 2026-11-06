import { Platform } from 'react-native';
import { LANGS, startInstruction } from './personas';
import { ChatMessage, Lang, TutorJson } from './types';

const BASE = 'https://api.openai.com/v1';

export class OpenAIError extends Error {}

async function check(res: Response): Promise<Response> {
  if (res.ok) return res;
  let detail = '';
  try {
    const j = await res.json();
    detail = j?.error?.message ?? '';
  } catch {}
  if (res.status === 401) throw new OpenAIError('Chave de API inválida. Verifique em Configurações.');
  if (res.status === 429) throw new OpenAIError('Limite/saldo da API excedido (429). ' + detail);
  throw new OpenAIError(`Erro da OpenAI (${res.status}). ${detail}`);
}

function parseTutorJson(raw: string): TutorJson {
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { reply_target_lang: raw, translation_pt: '', correction_note: null, xp_awarded: 5, pronunciation_tip: null, scenario_completed: false, vocab: [] };
    obj = JSON.parse(m[0]);
  }
  const str = (v: any) => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null);
  const xp = Number(obj.xp_awarded);
  return {
    reply_target_lang: String(obj.reply_target_lang ?? ''),
    translation_pt: String(obj.translation_pt ?? ''),
    correction_note: str(obj.correction_note),
    xp_awarded: Number.isFinite(xp) ? Math.max(0, Math.min(15, Math.round(xp))) : 5,
    pronunciation_tip: str(obj.pronunciation_tip),
    scenario_completed: obj.scenario_completed === true,
    vocab: (Array.isArray(obj.vocab) ? obj.vocab : [])
      .filter((v: any) => v && str(v.term) && str(v.meaning_pt))
      .slice(0, 3)
      .map((v: any) => ({ term: String(v.term).trim(), meaning_pt: String(v.meaning_pt).trim() })),
  };
}

interface ChatArgs {
  apiKey: string;
  model: string;
  system: string;
  lang: Lang;
  free: boolean;
  history: ChatMessage[];
  /** true => abre a conversa (sem fala do usuário) */
  start?: boolean;
}

export async function askTutor(a: ChatArgs): Promise<TutorJson> {
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: a.system },
  ];
  if (a.start) {
    messages.push({ role: 'user', content: startInstruction(a.lang, a.free) });
  } else {
    // Mantém só as últimas 20 mensagens para controlar custo
    for (const m of a.history.slice(-20)) {
      if (m.role === 'user') messages.push({ role: 'user', content: (m.fromVoice ? '🎤 ' : '') + m.text });
      else
        messages.push({
          role: 'assistant',
          content: JSON.stringify({
            reply_target_lang: m.text,
            translation_pt: m.translation ?? '',
            correction_note: m.correction ?? null,
            xp_awarded: 0,
            pronunciation_tip: m.pronunciation ?? null,
            scenario_completed: false,
            vocab: [],
          }),
        });
    }
  }
  const res = await check(
    await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${a.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: a.model,
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })
  );
  const data = await res.json();
  return parseTutorJson(data.choices?.[0]?.message?.content ?? '');
}

export async function transcribe(apiKey: string, uri: string, lang: Lang): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    const t = blob.type;
    const ext = t.includes('mp4') ? 'mp4' : t.includes('ogg') ? 'ogg' : t.includes('wav') ? 'wav' : 'webm';
    form.append('file', blob, `speech.${ext}`);
  } else {
    form.append('file', { uri, name: 'speech.m4a', type: 'audio/m4a' } as any);
  }
  form.append('model', 'whisper-1');
  form.append('language', LANGS[lang].whisper);
  const res = await check(
    await fetch(`${BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })
  );
  const data = await res.json();
  return String(data.text ?? '').trim();
}

export async function synthesize(apiKey: string, text: string, voice: string, speed = 1): Promise<ArrayBuffer> {
  const res = await check(
    await fetch(`${BASE}/audio/speech`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3', speed }),
    })
  );
  return res.arrayBuffer();
}

export async function validateKey(apiKey: string): Promise<void> {
  await check(await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${apiKey}` } }));
}
