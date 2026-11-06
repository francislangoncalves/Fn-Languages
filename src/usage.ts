/** "1h2m3.5s", "250ms", "7.66s" → milissegundos */
export function parseDuration(v: string | null | undefined): number | undefined {
  if (!v) return undefined;
  let ms = 0;
  let found = false;
  for (const m of v.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    found = true;
    const n = parseFloat(m[1]);
    ms += m[2] === 'h' ? n * 3600000 : m[2] === 'm' ? n * 60000 : m[2] === 's' ? n * 1000 : n;
  }
  return found ? ms : undefined;
}

export interface RateLimit {
  at: number;
  limitReq?: number; // requisições por dia
  remainingReq?: number;
  resetReqAt?: number; // timestamp absoluto
  limitTok?: number; // tokens por minuto
  remainingTok?: number;
  resetTokAt?: number;
  blockedUntil?: number; // recebeu 429
}

const num = (v: string | null) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : undefined);

/** Lê os cabeçalhos x-ratelimit-* (padrão Groq/OpenAI). No navegador só aparecem se o servidor os expuser via CORS. */
export function readRateHeaders(h: Headers, status: number, prev?: RateLimit): RateLimit {
  const now = Date.now();
  const r: RateLimit = { ...(prev ?? {}), at: now };
  const lr = num(h.get('x-ratelimit-limit-requests'));
  const rr = num(h.get('x-ratelimit-remaining-requests'));
  const lt = num(h.get('x-ratelimit-limit-tokens'));
  const rt = num(h.get('x-ratelimit-remaining-tokens'));
  const rsR = parseDuration(h.get('x-ratelimit-reset-requests'));
  const rsT = parseDuration(h.get('x-ratelimit-reset-tokens'));
  if (lr !== undefined) r.limitReq = lr;
  if (rr !== undefined) r.remainingReq = rr;
  if (lt !== undefined) r.limitTok = lt;
  if (rt !== undefined) r.remainingTok = rt;
  if (rsR !== undefined) r.resetReqAt = now + rsR;
  if (rsT !== undefined) r.resetTokAt = now + rsT;
  if (status === 429) {
    const ra = num(h.get('retry-after'));
    r.blockedUntil = now + (ra !== undefined ? ra * 1000 : 60000);
  } else if (status >= 200 && status < 300) {
    r.blockedUntil = undefined;
  }
  return r;
}

export function hasLimitInfo(r?: RateLimit) {
  return !!r && (r.limitReq !== undefined || r.limitTok !== undefined || r.remainingReq !== undefined || r.remainingTok !== undefined);
}

export function fmtCountdown(ms: number): string {
  if (ms <= 0) return 'agora';
  const s = Math.ceil(ms / 1000);
  if (s < 90) return `${s} s`;
  const m = Math.ceil(s / 60);
  if (m < 90) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

export const fmtNum = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : String(n));
