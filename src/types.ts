export type Lang = 'en' | 'pl';
export type PersonaId = 'friend' | 'recruiter' | 'immigration';
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VocabItem {
  term: string;
  meaning: string; // Português
  lang: Lang;
  addedAt: number;
  scenarioId?: string;
  learned?: boolean;
}

export interface TutorJson {
  reply_target_lang: string;
  translation_pt: string;
  correction_note: string | null;
  xp_awarded: number;
  pronunciation_tip: string | null;
  scenario_completed: boolean;
  /** Extensão: até 3 palavras/expressões novas da resposta, p/ o caderno de vocabulário */
  vocab: { term: string; meaning_pt: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Fala do usuário ou reply_target_lang do tutor */
  text: string;
  translation?: string;
  correction?: string | null;
  pronunciation?: string | null;
  xp?: number; // XP ganho pela mensagem do usuário (exibido no balão do tutor)
  fromVoice?: boolean;
  createdAt: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  lang: Lang;
  xp: number;
  streak: number;
  bestStreak: number;
  lastPractice: string | null; // YYYY-MM-DD local
  useOwnKey: boolean;
  unlockAll: boolean;
  /** "<lang>:<scenarioId>" -> nº de vezes concluído */
  completed: Record<string, number>;
  vocab: VocabItem[];
  /** "<lang>:<scenarioId>[:persona]" -> mensagens */
  chats: Record<string, ChatMessage[]>;
  createdAt: number;
}
