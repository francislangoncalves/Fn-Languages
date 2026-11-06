import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelRecording, ensureMicPermission, speak, startRecording, stopRecording, stopSpeaking } from '../src/audio';
import Avatar from '../src/components/Avatar';
import MessageBubble from '../src/components/MessageBubble';
import { FREE_ID, getScenario, isDone } from '../src/curriculum';
import { confirmAction, notify } from '../src/dialog';
import { BAND_INFO, bandOf, levelFromXp } from '../src/levels';
import { askTutor, transcribe } from '../src/openai';
import { getProvider } from '../src/provider';
import { buildSystemPrompt, LANGS, PERSONAS, personaName } from '../src/personas';
import { chatKeyFor, useActiveProfile, useStore } from '../src/store';
import { C } from '../src/theme';
import { AvatarState, ChatMessage, PersonaId } from '../src/types';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scenario?: string; persona?: string }>();
  const scenarioId = params.scenario ?? FREE_ID;
  const personaId = (params.persona as PersonaId) ?? 'friend';
  const free = scenarioId === FREE_ID;

  const profile = useActiveProfile()!;
  const scenario = getScenario(scenarioId, profile.field)!;
  const { settings, setChat, clearChat, awardXp, completeScenario, addVocab } = useStore();
  const key = chatKeyFor(profile.lang, scenarioId, personaId);
  const messages = profile.chats[key] ?? [];
  const level = levelFromXp(profile.xp);
  const band = bandOf(level);
  const speed = BAND_INFO[band].speed;
  const persona = PERSONAS[personaId];
  const emoji = free ? persona.emoji : scenario.emoji;

  const [avatar, setAvatar] = useState<AvatarState>('idle');
  const [meter, setMeter] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [done, setDone] = useState<{ xp: number; level: number } | null>(null);
  const [showGoals, setShowGoals] = useState(!free && messages.length < 3);
  const listRef = useRef<FlatList>(null);

  // Refs p/ callbacks de áudio não usarem estado velho
  const msgsRef = useRef<ChatMessage[]>(messages);
  msgsRef.current = messages;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const keyRef = useRef(key);
  keyRef.current = key;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const busyRef = useRef(false);
  const focusedRef = useRef(true);
  const recordingRef = useRef(false);
  const doneRef = useRef(false);

  const modelName = () => (getProvider().id === 'openai' ? settingsRef.current.model : getProvider().chatModel);
  const apiKey = () => useStore.getState().effectiveKey(profileRef.current.id);

  const commit = (msgs: ChatMessage[]) => {
    msgsRef.current = msgs;
    setChat(profileRef.current.id, keyRef.current, msgs);
  };

  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast((c) => (c === t ? null : c)), 2800);
  };

  const systemPrompt = () =>
    buildSystemPrompt({
      lang: profileRef.current.lang,
      level: levelFromXp(profileRef.current.xp),
      scenario: free ? undefined : scenario,
      persona: personaId,
      field: profileRef.current.field,
    });

  const say = useCallback(async (text: string, slow = false) => {
    setAvatar('speaking');
    try {
      await speak(text, profileRef.current.lang, settingsRef.current, apiKey(), slow ? Math.min(speedRef.current, 0.7) : speedRef.current);
    } catch {}
    setAvatar('idle');
  }, []);

  const beginListening = useCallback(async () => {
    if (recordingRef.current || busyRef.current) return;
    if (!(await ensureMicPermission())) return notify('Microfone', 'Permita o acesso ao microfone para falar com o tutor.');
    try {
      recordingRef.current = true;
      setRecording(true);
      setAvatar('listening');
      await startRecording({
        autoStopOnSilence: settingsRef.current.handsFree,
        onAutoStop: () => finishListening(),
        onLevel: setMeter,
      });
    } catch {
      recordingRef.current = false;
      setRecording(false);
      setAvatar('idle');
      setError('Não consegui iniciar a gravação.');
    }
  }, []);

  const finishListening = useCallback(async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setRecording(false);
    setMeter(0);
    const uri = await stopRecording();
    if (!uri) return setAvatar('idle');
    setAvatar('thinking');
    try {
      const text = await transcribe(apiKey(), uri, profileRef.current.lang);
      if (!text) {
        setAvatar('idle');
        setError('Não entendi o áudio. Tente de novo.');
        if (settingsRef.current.handsFree && focusedRef.current) beginListening();
        return;
      }
      await sendText(text, true);
    } catch (e: any) {
      setAvatar('idle');
      setError(e?.message ?? 'Erro ao transcrever.');
    }
  }, []);

  /** Processa resposta do tutor: XP, vocabulário, conclusão do cenário */
  const handleReply = async (r: Awaited<ReturnType<typeof askTutor>>, userTurns: number, isStart: boolean) => {
    const pid = profileRef.current.id;
    const lang = profileRef.current.lang;
    let gained = 0;
    if (!isStart) {
      gained = Math.max(5, r.xp_awarded); // mensagem enviada vale no mínimo 5; livre de erros/riqueza sobem até 15
      const res = awardXp(pid, gained);
      if (res.leveledUp) flash(`🎉 Nível ${res.level}! (+${gained} XP)`);
      else flash(`+${gained} XP`);
    }
    if (r.vocab.length) addVocab(pid, r.vocab.map((v) => ({ term: v.term, meaning: v.meaning_pt, lang, scenarioId: free ? undefined : scenarioId })));

    const msgs = [...msgsRef.current];
    const botMsg: ChatMessage = {
      id: uid(), role: 'assistant', text: r.reply_target_lang, translation: r.translation_pt,
      correction: r.correction_note, pronunciation: r.pronunciation_tip, guide: r.pronunciation_guide, xp: gained || undefined, createdAt: Date.now(),
    };
    commit([...msgs, botMsg]);

    if (!free && !isStart && r.scenario_completed && userTurns >= 4 && !doneRef.current) {
      doneRef.current = true;
      const repeat = isDone(useStore.getState().profiles.find((p) => p.id === pid)!, scenarioId);
      const bonus = repeat ? 15 : scenario.xpReward;
      const res = completeScenario(pid, lang, scenarioId, bonus);
      setDone({ xp: bonus, level: res.level });
    }
    return r.reply_target_lang;
  };

  const sendText = useCallback(async (text: string, fromVoice = false) => {
    if (busyRef.current) return;
    if (!apiKey()) return setError('Sem chave de API para este perfil. Configure em Configurações ou no perfil.');
    busyRef.current = true;
    setError(null);
    const withUser = [...msgsRef.current, { id: uid(), role: 'user' as const, text, fromVoice, createdAt: Date.now() }];
    commit(withUser);
    setAvatar('thinking');
    try {
      const r = await askTutor({
        apiKey: apiKey(), model: modelName(), system: systemPrompt(), lang: profileRef.current.lang, free, history: withUser,
      });
      const reply = await handleReply(r, withUser.filter((m) => m.role === 'user').length, false);
      busyRef.current = false;
      if (settingsRef.current.autoSpeak) await say(reply);
      else setAvatar('idle');
      if (settingsRef.current.handsFree && focusedRef.current) beginListening();
    } catch (e: any) {
      busyRef.current = false;
      setAvatar('idle');
      setError(e?.message ?? 'Erro ao falar com o tutor.');
    }
  }, []);

  const startConversation = useCallback(async () => {
    if (busyRef.current) return;
    if (!apiKey()) return setError('Sem chave de API para este perfil. Configure em Configurações ou no perfil.');
    busyRef.current = true;
    setError(null);
    setAvatar('thinking');
    try {
      const r = await askTutor({
        apiKey: apiKey(), model: modelName(), system: systemPrompt(), lang: profileRef.current.lang, free, history: [], start: true,
      });
      const reply = await handleReply({ ...r, correction_note: null, pronunciation_tip: null, scenario_completed: false }, 0, true);
      busyRef.current = false;
      if (settingsRef.current.autoSpeak) await say(reply);
      else setAvatar('idle');
      if (settingsRef.current.handsFree && focusedRef.current) beginListening();
    } catch (e: any) {
      busyRef.current = false;
      setAvatar('idle');
      setError(e?.message ?? 'Erro ao iniciar a conversa.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      if (msgsRef.current.length === 0) startConversation();
      return () => {
        focusedRef.current = false;
        recordingRef.current = false;
        cancelRecording();
        stopSpeaking();
      };
    }, [key])
  );

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length]);

  const onMicPressIn = () => settings.recordMode === 'hold' && beginListening();
  const onMicPressOut = () => settings.recordMode === 'hold' && finishListening();
  const onMicPress = () => {
    if (settings.recordMode !== 'tap') return;
    recordingRef.current ? finishListening() : beginListening();
  };

  const submitText = () => {
    const t = input.trim();
    if (!t) return;
    setInput('');
    stopSpeaking();
    sendText(t);
  };

  const reset = () =>
    confirmAction('Reiniciar cenário?', 'O histórico desta conversa será apagado (seu XP é mantido).', 'Reiniciar', () => {
      stopSpeaking();
      doneRef.current = false;
      setDone(null);
      clearChat(profileRef.current.id, keyRef.current);
      msgsRef.current = [];
      setTimeout(startConversation, 50);
    });

  const title = free ? `${persona.emoji} ${personaName(personaId, profile.lang, profile.field).split(' (')[0]}` : `${scenario.emoji} ${scenario.title}`;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Pressable onPress={reset} hitSlop={8}>
              <Ionicons name="refresh" size={22} color={C.text} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={s.statusRow}>
          <Text style={s.badge}>{LANGS[profile.lang].flag} Nv {level} · {BAND_INFO[band].cefr}</Text>
          {!free && (
            <Pressable onPress={() => setShowGoals((v) => !v)}>
              <Text style={s.badge}>🎯 Objetivos {showGoals ? '▲' : '▼'}</Text>
            </Pressable>
          )}
          <Text style={[s.badge, { color: C.accent }]}>{profile.xp} XP</Text>
        </View>

        {showGoals && !free && (
          <View style={s.goals}>
            {scenario.objectives.map((o, i) => (
              <Text key={i} style={s.goal}>• {o}</Text>
            ))}
          </View>
        )}

        <Avatar emoji={emoji} state={avatar} level={meter} />

        {toast && (
          <View style={s.toast}>
            <Text style={s.toastText}>{toast}</Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} onReplay={say} hideText={band === 'advanced'} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          style={{ flex: 1 }}
        />

        {done && (
          <View style={s.done}>
            <Text style={s.doneTitle}>🏆 Cenário concluído! +{done.xp} XP</Text>
            <Pressable style={s.doneBtn} onPress={() => router.back()}>
              <Text style={s.doneBtnText}>Voltar à trilha</Text>
            </Pressable>
          </View>
        )}

        {error && (
          <Pressable onPress={() => setError(null)} style={s.err}>
            <Text style={s.errText}>{error}</Text>
          </Pressable>
        )}

        <View style={s.bar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Escreva em ${LANGS[profile.lang].name.split(' ')[0]}…`}
            placeholderTextColor={C.muted}
            multiline
            onSubmitEditing={submitText}
            onKeyPress={(e) => {
              const ne = e.nativeEvent as any;
              if (Platform.OS === 'web' && ne.key === 'Enter' && !ne.shiftKey) {
                e.preventDefault();
                submitText();
              }
            }}
          />
          {input.trim() ? (
            <Pressable style={s.send} onPress={submitText}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={[s.send, recording && { backgroundColor: C.danger, transform: [{ scale: 1.15 }] }]}
              onPressIn={onMicPressIn}
              onPressOut={onMicPressOut}
              onPress={onMicPress}
            >
              <Ionicons name={recording ? 'stop' : 'mic'} size={22} color="#fff" />
            </Pressable>
          )}
        </View>
        <Text style={s.tip}>
          {settings.handsFree ? 'Hands-free ativo: fale quando o microfone abrir' : settings.recordMode === 'hold' ? 'Segure o microfone para falar' : 'Toque no microfone para gravar/parar'}
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 2 },
  badge: { color: C.muted, fontSize: 12, fontWeight: '700' },
  goals: { backgroundColor: C.card, marginHorizontal: 12, marginTop: 8, padding: 12, borderRadius: 12, gap: 4 },
  goal: { color: C.text, fontSize: 13, lineHeight: 18 },
  toast: { position: 'absolute', top: 40, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, zIndex: 10 },
  toastText: { color: '#06281D', fontWeight: '800' },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 8 },
  input: { flex: 1, minHeight: 46, maxHeight: 120, backgroundColor: C.card, color: C.text, borderRadius: 23, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 16, borderWidth: 1, borderColor: C.border },
  send: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  tip: { color: C.muted, fontSize: 11, textAlign: 'center', paddingVertical: 6 },
  err: { backgroundColor: '#4A1D1D', marginHorizontal: 12, padding: 10, borderRadius: 10, marginBottom: 4 },
  errText: { color: '#FECACA', fontSize: 13 },
  done: { backgroundColor: '#10302A', borderColor: C.accent, borderWidth: 1, marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 14, alignItems: 'center', gap: 8 },
  doneTitle: { color: C.accent, fontWeight: '800', fontSize: 16 },
  doneBtn: { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 14 },
  doneBtnText: { color: '#06281D', fontWeight: '800' },
});
