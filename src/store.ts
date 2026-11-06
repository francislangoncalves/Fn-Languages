import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { dayKey, levelFromXp, nextStreak } from './levels';
import { scenarioKey } from './curriculum';
import { resetModelCache, setUsageSink } from './openai';
import { RateLimit, readRateHeaders } from './usage';
import { ProviderId, PROVIDERS, setProvider } from './provider';
import { ChatMessage, Field, Lang, Profile, VocabItem } from './types';

export const MAX_PROFILES = 5;
const KEY_NAME: Record<ProviderId, string> = { openai: 'openai_api_key', groq: 'groq_api_key' };
const KEY_SETTINGS = 'settings_v1';
const KEY_PROFILES = 'profiles_v2';
const KEY_RATE = 'ratelimit_v1';
const ownKeyName = (id: string) => `profile_key_${id}`;

// Na web não há cofre seguro: a chave fica no localStorage do navegador do próprio usuário.
const secure = {
  get: (k: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === 'web' ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
};

export interface Settings {
  provider: ProviderId;
  model: 'gpt-4o-mini' | 'gpt-4o';
  voiceEngine: 'openai' | 'device';
  voice: 'alloy' | 'echo' | 'nova' | 'shimmer' | 'onyx' | 'fable';
  autoSpeak: boolean;
  recordMode: 'hold' | 'tap';
  handsFree: boolean;
}

const DEFAULTS: Settings = {
  provider: 'groq',
  model: 'gpt-4o-mini',
  voiceEngine: 'device',
  voice: 'alloy',
  autoSpeak: true,
  recordMode: 'hold',
  handsFree: false,
};

export const chatKeyFor = (lang: Lang, scenarioId: string, persona?: string) =>
  scenarioId === 'free' ? `${lang}:free:${persona ?? 'friend'}` : `${lang}:${scenarioId}`;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export interface NewProfile {
  name: string;
  field: Field;
  avatar: string;
  lang: Lang;
  useOwnKey: boolean;
  unlockAll: boolean;
}

export interface XpResult {
  gained: number;
  level: number;
  leveledUp: boolean;
  streak: number;
}

interface State {
  ready: boolean;
  globalKey: string; // chave global do provedor ativo
  allKeys: Record<ProviderId, string>;
  ownKeys: Record<string, string>;
  profiles: Profile[];
  activeId: string | null;
  settings: Settings;
  rateLimit: Partial<Record<ProviderId, RateLimit>>;

  load: () => Promise<void>;
  setGlobalKey: (k: string) => Promise<void>;
  updateSettings: (p: Partial<Settings>) => void;

  createProfile: (p: NewProfile, ownKey?: string) => Promise<string | null>;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  setOwnKey: (id: string, key: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActive: (id: string) => void;
  effectiveKey: (id?: string | null) => string;

  setChat: (id: string, key: string, msgs: ChatMessage[]) => void;
  clearChat: (id: string, key: string) => void;
  clearAllChats: (id: string) => void;
  awardXp: (id: string, xp: number) => XpResult;
  completeScenario: (id: string, lang: Lang, scenarioId: string, xp: number) => XpResult;
  addVocab: (id: string, items: { term: string; meaning: string; lang: Lang; scenarioId?: string }[]) => void;
  toggleLearned: (id: string, term: string, lang: Lang) => void;
  recordUsage: (kind: 'chat' | 'stt', tokens: number, headers: Headers, status: number) => void;
}

export const useStore = create<State>((set, get) => {
  const persist = () => {
    const { profiles, activeId } = get();
    AsyncStorage.setItem(KEY_PROFILES, JSON.stringify({ profiles, activeId })).catch(() => {});
  };
  const patch = (id: string, fn: (p: Profile) => Profile) => {
    set({ profiles: get().profiles.map((p) => (p.id === id ? fn(p) : p)) });
    persist();
  };

  return {
    ready: false,
    globalKey: '',
    allKeys: { groq: '', openai: '' },
    ownKeys: {},
    profiles: [],
    activeId: null,
    settings: DEFAULTS,
    rateLimit: {},

    load: async () => {
      const allKeys: Record<ProviderId, string> = { groq: '', openai: '' };
      for (const id of Object.keys(KEY_NAME) as ProviderId[]) {
        try {
          allKeys[id] = (await secure.get(KEY_NAME[id])) ?? '';
        } catch {}
      }
      let settings = DEFAULTS;
      let profiles: Profile[] = [];
      let activeId: string | null = null;
      let rateLimit: Partial<Record<ProviderId, RateLimit>> = {};
      try {
        const s = await AsyncStorage.getItem(KEY_SETTINGS);
        if (s) settings = { ...DEFAULTS, ...JSON.parse(s) };
        const raw = await AsyncStorage.getItem(KEY_PROFILES);
        if (raw) {
          const j = JSON.parse(raw);
          profiles = j.profiles ?? [];
          activeId = j.activeId ?? null;
        }
        const rl = await AsyncStorage.getItem(KEY_RATE);
        if (rl) rateLimit = JSON.parse(rl);
      } catch {}
      // migração: perfis antigos ganham área (TI) e contadores de uso
      profiles = profiles.map((p) => ({ ...p, field: p.field ?? 'tech', usage: p.usage ?? {} }));
      const ownKeys: Record<string, string> = {};
      for (const p of profiles) {
        try {
          const k = await secure.get(ownKeyName(p.id));
          if (k) ownKeys[p.id] = k;
        } catch {}
      }
      if (!profiles.find((p) => p.id === activeId)) activeId = profiles[0]?.id ?? null;
      setProvider(settings.provider);
      set({ allKeys, globalKey: allKeys[settings.provider], ownKeys, settings, profiles, activeId, rateLimit, ready: true });
    },

    setGlobalKey: async (k) => {
      const key = k.trim();
      const pid = get().settings.provider;
      try {
        if (key) await secure.set(KEY_NAME[pid], key);
        else await secure.del(KEY_NAME[pid]);
      } catch {}
      resetModelCache();
      set({ globalKey: key, allKeys: { ...get().allKeys, [pid]: key } });
    },

    updateSettings: (p) => {
      const settings = { ...get().settings, ...p };
      if (p.provider) {
        setProvider(p.provider);
        resetModelCache();
        // OpenAI usa voz própria por padrão; Groq usa a do aparelho
        if (!PROVIDERS[p.provider].hasTts) settings.voiceEngine = 'device';
        set({ globalKey: get().allKeys[p.provider] });
      }
      set({ settings });
      AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(settings)).catch(() => {});
    },

    createProfile: async (np, ownKey) => {
      if (get().profiles.length >= MAX_PROFILES) return null;
      const profile: Profile = {
        id: uid(), name: np.name.trim(), avatar: np.avatar, lang: np.lang, field: np.field, usage: {},
        xp: 0, streak: 0, bestStreak: 0, lastPractice: null,
        useOwnKey: np.useOwnKey, unlockAll: np.unlockAll,
        completed: {}, vocab: [], chats: {}, createdAt: Date.now(),
      };
      set({ profiles: [...get().profiles, profile], activeId: profile.id });
      persist();
      if (ownKey?.trim()) await get().setOwnKey(profile.id, ownKey);
      return profile.id;
    },

    updateProfile: (id, p) => patch(id, (x) => ({ ...x, ...p })),

    setOwnKey: async (id, k) => {
      const key = k.trim();
      try {
        if (key) await secure.set(ownKeyName(id), key);
        else await secure.del(ownKeyName(id));
      } catch {}
      const ownKeys = { ...get().ownKeys };
      if (key) ownKeys[id] = key;
      else delete ownKeys[id];
      set({ ownKeys });
    },

    deleteProfile: async (id) => {
      try {
        await secure.del(ownKeyName(id));
      } catch {}
      const profiles = get().profiles.filter((p) => p.id !== id);
      const ownKeys = { ...get().ownKeys };
      delete ownKeys[id];
      set({ profiles, ownKeys, activeId: get().activeId === id ? profiles[0]?.id ?? null : get().activeId });
      persist();
    },

    setActive: (id) => {
      set({ activeId: id });
      persist();
    },

    effectiveKey: (id) => {
      const s = get();
      const p = s.profiles.find((x) => x.id === (id ?? s.activeId));
      if (p?.useOwnKey && s.ownKeys[p.id]) return s.ownKeys[p.id];
      return s.globalKey;
    },

    setChat: (id, key, msgs) => patch(id, (p) => ({ ...p, chats: { ...p.chats, [key]: msgs.slice(-120) } })),

    clearChat: (id, key) =>
      patch(id, (p) => {
        const chats = { ...p.chats };
        delete chats[key];
        return { ...p, chats };
      }),

    clearAllChats: (id) => patch(id, (p) => ({ ...p, chats: {} })),

    awardXp: (id, xp) => {
      const p = get().profiles.find((x) => x.id === id);
      if (!p) return { gained: 0, level: 1, leveledUp: false, streak: 0 };
      const before = levelFromXp(p.xp);
      const after = levelFromXp(p.xp + xp);
      const today = dayKey();
      const streak = nextStreak(p.lastPractice, p.streak, today);
      patch(id, (x) => ({ ...x, xp: x.xp + xp, streak, bestStreak: Math.max(x.bestStreak, streak), lastPractice: today }));
      return { gained: xp, level: after, leveledUp: after > before, streak };
    },

    completeScenario: (id, lang, scenarioId, xp) => {
      const k = scenarioKey(lang, scenarioId);
      patch(id, (p) => ({ ...p, completed: { ...p.completed, [k]: (p.completed[k] ?? 0) + 1 } }));
      return get().awardXp(id, xp);
    },

    addVocab: (id, items) =>
      patch(id, (p) => {
        const vocab = [...p.vocab];
        for (const it of items) {
          if (vocab.some((v) => v.lang === it.lang && v.term.toLowerCase() === it.term.toLowerCase())) continue;
          vocab.unshift({ ...it, addedAt: Date.now() } as VocabItem);
        }
        return { ...p, vocab: vocab.slice(0, 500) };
      }),

    recordUsage: (kind, tokens, headers, status) => {
      const { activeId, settings } = get();
      if (activeId && status >= 200 && status < 300) {
        const day = dayKey();
        patch(activeId, (p) => {
          const cur = p.usage?.[day] ?? { req: 0, stt: 0, tok: 0 };
          const usage = {
            ...(p.usage ?? {}),
            [day]: { req: cur.req + (kind === 'chat' ? 1 : 0), stt: cur.stt + (kind === 'stt' ? 1 : 0), tok: cur.tok + tokens },
          };
          // mantém só os últimos 30 dias
          Object.keys(usage).sort().slice(0, -30).forEach((k) => delete usage[k]);
          return { ...p, usage };
        });
      }
      const prov = settings.provider;
      const rateLimit = { ...get().rateLimit, [prov]: readRateHeaders(headers, status, get().rateLimit[prov]) };
      set({ rateLimit });
      AsyncStorage.setItem(KEY_RATE, JSON.stringify(rateLimit)).catch(() => {});
    },

    toggleLearned: (id, term, lang) =>
      patch(id, (p) => ({
        ...p,
        vocab: p.vocab.map((v) => (v.term === term && v.lang === lang ? { ...v, learned: !v.learned } : v)),
      })),
  };
});

setUsageSink((u) => useStore.getState().recordUsage(u.kind, u.tokens, u.headers, u.status));

export const useActiveProfile = () => useStore((s) => s.profiles.find((p) => p.id === s.activeId));
