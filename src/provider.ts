export type ProviderId = 'groq' | 'openai';

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  base: string;
  chatModel: string;
  sttModel: string;
  /** OpenAI tem TTS próprio; Groq usa a voz do aparelho (grátis) */
  hasTts: boolean;
  keyUrl: string;
  keyHint: string;
  free: boolean;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  groq: {
    id: 'groq',
    label: 'Groq (grátis)',
    base: 'https://api.groq.com/openai/v1',
    chatModel: 'llama-3.3-70b-versatile',
    sttModel: 'whisper-large-v3-turbo',
    hasTts: false,
    keyUrl: 'https://console.groq.com/keys',
    keyHint: 'gsk_...',
    free: true,
  },
  openai: {
    id: 'openai',
    label: 'OpenAI (pago)',
    base: 'https://api.openai.com/v1',
    chatModel: 'gpt-4o-mini',
    sttModel: 'whisper-1',
    hasTts: true,
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'sk-...',
    free: false,
  },
};

let current: ProviderInfo = PROVIDERS.groq;
export const setProvider = (id: ProviderId) => {
  current = PROVIDERS[id] ?? PROVIDERS.groq;
};
export const getProvider = () => current;
