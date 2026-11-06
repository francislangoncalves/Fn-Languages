/** XP acumulado necessário para ALCANÇAR o nível n (nível 1 = 0 XP). */
export const xpToReach = (n: number) => 40 * (n - 1) ** 2 + 60 * (n - 1);

export function levelFromXp(xp: number): number {
  let n = 1;
  while (xp >= xpToReach(n + 1)) n++;
  return n;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const a = xpToReach(level);
  const b = xpToReach(level + 1);
  return { level, into: xp - a, need: b - a, pct: (xp - a) / (b - a) };
}

export type Band = 'beginner' | 'intermediate' | 'advanced';

export function bandOf(level: number): Band {
  return level <= 5 ? 'beginner' : level <= 15 ? 'intermediate' : 'advanced';
}

export const BAND_INFO: Record<Band, { label: string; cefr: string; speed: number }> = {
  beginner: { label: 'Iniciante', cefr: 'A1–A2', speed: 0.85 },
  intermediate: { label: 'Intermediário', cefr: 'B1–B2', speed: 1.0 },
  advanced: { label: 'Avançado', cefr: 'C1', speed: 1.1 },
};

export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Nova ofensiva ao praticar hoje. */
export function nextStreak(last: string | null, streak: number, today = dayKey()): number {
  if (last === today) return Math.max(1, streak);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return last === dayKey(y) ? streak + 1 : 1;
}

/** Streak válido para exibir (zera se passou mais de 1 dia sem praticar). */
export function liveStreak(last: string | null, streak: number): number {
  if (!last) return 0;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return last === dayKey() || last === dayKey(y) ? streak : 0;
}
