import { Platform } from 'react-native';
import { LANGS, startInstruction } from './personas';
import { ChatMessage, Lang, TutorJson } from './types';

import { getProvider } from './provider';

const BASE_ = () => getProvider().base;

export class OpenAIError extends Error {
  status = 0;
  detail = '';
}

async function check(res: Response): Promise<Response> {
  if (res.ok) return res;
  let detail = '';
  try {
    const j = await res.json();
    detail = j?.error?.message ?? '';
  } catch {}
  let msg = `Erro do provedor de IA (${res.status}). ${detail}`;
  if (res.status === 401) msg = 'Chave de API inválida para este provedor. Verifique em Configurações.';
  if (res.status === 429) msg = 'Limite de uso atingido (429): espere um pouco e tente de novo. ' + detail;
  const e = new OpenAIError(msg);
  e.status = res.status;
  e.detail = detail;
  throw e;
}

/* ───── Descoberta automática de modelos (Groq troca/aposenta modelos com frequência) ───── */

const PREF_CHAT = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
  'openai/gpt-oss-20b',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
];
const PREF_STT = ['whisper-large-v3-turbo', 'whisper-large-v3', 'distil-whisper-large-v3-en'];
const NOT_CHAT = /whisper|tts|playai|guard|safeguard|orpheus|embed|moderation|compound/i;

const resolved: { chat?: string; stt?: string; ids?: string[] } = {};

async function listModels(apiKey: string, force: boolean): Promise<string[]> {
  if (resolved.ids && !force) return resolved.ids;
  const res = await check(await fetch(`${BASE_()}/models`, { headers: { Authorization: `Bearer ${apiKey}` } }));
  const data = await res.json();
  resolved.ids = (data.data ?? []).map((m: any) => String(m.id));
  return resolved.ids!;
}

export function resetModelCache() {
  resolved.chat = resolved.stt = resolved.ids = undefined;
}

async function resolveModel(apiKey: string, kind: 'chat' | 'stt', force = false): Promise<string> {
  const p = getProvider();
  const fallback = kind === 'chat' ? p.chatModel : p.sttModel;
  if (!force && resolved[kind]) return resolved[kind]!;
  try {
    const ids = await listModels(apiKey, force);
    const pool = kind === 'chat' ? ids.filter((i) => !NOT_CHAT.test(i)) : ids.filter((i) => /whisper/i.test(i));
    const pref = kind === 'chat' ? PREF_CHAT : PREF_STT;
    resolved[kind] = pref.find((m) => pool.includes(m)) ?? pool[0] ?? fallback;
  } catch (e: any) {
    if (e?.status === 401) throw e;
    resolved[kind] = fallback;
  }
  return resolved[kind]!;
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
  const groq = getProvider().id === 'groq';
  const call = async (model: string, json: boolean) =>
    fetch(`${BASE_()}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${a.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

  let model = groq ? await resolveModel(a.apiKey, 'chat') : a.model;
  let json = true;
  let res = await call(model, json);
  // Modelo inexistente/aposentado → relista os modelos da chave e tenta de novo
  if (groq && (res.status === 404 || res.status === 400)) {
    const peek = await res.clone().text();
    if (/model/i.test(peek) && /(not exist|not found|decommission|no access|does not exist)/i.test(peek)) {
      model = await resolveModel(a.apiKey, 'chat', true);
      res = await call(model, json);
    }
  }
  // Modelo sem suporte a JSON mode → tenta sem (o parser aceita texto)
  if (res.status === 400) {
    const peek = await res.clone().text();
    if (/json|response_format/i.test(peek)) {
      json = false;
      res = await call(model, json);
    }
  }
  await check(res);
  const data = await res.json();
  return parseTutorJson(data.choices?.[0]?.message?.content ?? '');
}

export async function transcribe(apiKey: string, uri: string, lang: Lang): Promise<string> {
  let file: Blob | null = null;
  let ext = 'm4a';
  if (Platform.OS === 'web') {
    file = await (await fetch(uri)).blob();
    const t = file.type;
    ext = t.includes('mp4') ? 'mp4' : t.includes('ogg') ? 'ogg' : t.includes('wav') ? 'wav' : 'webm';
  }
  const build = (model: string) => {
    const form = new FormData();
    if (file) form.append('file', file, `speech.${ext}`);
    else form.append('file', { uri, name: 'speech.m4a', type: 'audio/m4a' } as any);
    form.append('model', model);
    form.append('language', LANGS[lang].whisper);
    return form;
  };
  const groq = getProvider().id === 'groq';
  const send = (model: string) =>
    fetch(`${BASE_()}/audio/transcriptions`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: build(model) });

  let model = groq ? await resolveModel(apiKey, 'stt') : getProvider().sttModel;
  let res = await send(model);
  if (groq && (res.status === 404 || res.status === 400)) {
    const peek = await res.clone().text();
    if (/model/i.test(peek)) {
      model = await resolveModel(apiKey, 'stt', true);
      res = await send(model);
    }
  }
  await check(res);
  const data = await res.json();
  return String(data.text ?? '').trim();
}

export async function synthesize(apiKey: string, text: string, voice: string, speed = 1): Promise<ArrayBuffer> {
  const res = await check(
    await fetch(`${BASE_()}/audio/speech`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3', speed }),
    })
  );
  return res.arrayBuffer();
}

export async function validateKey(apiKey: string): Promise<void> {
  await check(await fetch(`${BASE_()}/models`, { headers: { Authorization: `Bearer ${apiKey}` } }));
}
