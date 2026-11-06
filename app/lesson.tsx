import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { speakLocal } from '../src/audio';
import { getLesson, Row } from '../src/lessons';
import { scenarioKey } from '../src/curriculum';
import { useActiveProfile, useStore } from '../src/store';
import { C } from '../src/theme';

interface Q {
  kind: 'read' | 'listen';
  answer: Row;
  options: Row[];
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function makeQuiz(rows: Row[]): Q[] {
  // linhas com "t" curto e significado simples funcionam melhor como pergunta
  const pool = rows.filter((r) => r.t.length <= 28);
  return shuffle(pool)
    .slice(0, 6)
    .map((answer, i) => ({
      kind: i % 2 === 0 ? 'read' : 'listen',
      answer,
      options: shuffle([answer, ...shuffle(pool.filter((r) => r !== answer)).slice(0, 3)]),
    }));
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const profile = useActiveProfile();
  const { settings, completeScenario } = useStore();
  const lesson = getLesson(id ?? '');
  const [slow, setSlow] = useState(true);
  const [quiz, setQuiz] = useState<Q[] | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<Row | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ pass: boolean; xp: number } | null>(null);
  void settings;
  const rows = useMemo(() => lesson?.rows ?? [], [lesson]);
  if (!lesson || !profile) return null;

  const play = (t: string) => speakLocal(t, lesson.lang, slow ? 0.6 : 0.95);
  const alreadyDone = (profile.completed[scenarioKey(lesson.lang, lesson.id)] ?? 0) > 0;

  const start = () => {
    setQuiz(makeQuiz(rows));
    setQi(0);
    setScore(0);
    setPicked(null);
    setResult(null);
  };

  const answer = (o: Row) => {
    if (picked || !quiz) return;
    setPicked(o);
    if (o === quiz[qi].answer) setScore((s) => s + 1);
  };

  const finishNoQuiz = () => {
    const xp = alreadyDone ? 5 : lesson.xp;
    completeScenario(profile.id, lesson.lang, lesson.id, xp);
    router.back();
  };

  const next = () => {
    if (!quiz) return;
    if (qi + 1 < quiz.length) {
      setQi(qi + 1);
      setPicked(null);
      return;
    }
    const pass = score / quiz.length >= 0.6;
    let xp = 0;
    if (pass) {
      xp = alreadyDone ? 10 : lesson.xp;
      completeScenario(profile.id, lesson.lang, lesson.id, xp);
    }
    setResult({ pass, xp });
  };

  /* ───────── Quiz ───────── */
  if (quiz) {
    const q = quiz[qi];
    return (
      <ScrollView contentContainerStyle={s.c}>
        <Stack.Screen options={{ title: 'Praticar' }} />
        {result ? (
          <View style={s.result}>
            <Text style={{ fontSize: 56 }}>{result.pass ? '🏆' : '💪'}</Text>
            <Text style={s.h1}>{score}/{quiz.length} acertos</Text>
            <Text style={s.p}>
              {result.pass ? `Lição concluída! +${result.xp} XP` : 'Quase lá! Releia a lição, ouça de novo e tente outra vez (precisa de 60%).'}
            </Text>
            <Pressable style={s.btn} onPress={result.pass ? () => router.back() : start}>
              <Text style={s.btnText}>{result.pass ? 'Voltar à trilha' : 'Tentar de novo'}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={s.count}>Pergunta {qi + 1} de {quiz.length}</Text>
            {q.kind === 'read' ? (
              <Text style={s.h1}>Como se diz "{q.answer.pt}"?</Text>
            ) : (
              <>
                <Text style={s.h1}>Ouça e escolha o significado</Text>
                <Pressable style={s.listen} onPress={() => play(q.answer.t)}>
                  <Ionicons name="volume-high" size={28} color="#fff" />
                  <Text style={s.btnText}>Ouvir</Text>
                </Pressable>
              </>
            )}
            {q.options.map((o) => {
              const right = o === q.answer;
              const bg = !picked ? C.card : right ? '#10302A' : o === picked ? '#4A1D1D' : C.card;
              const border = !picked ? 'transparent' : right ? C.accent : o === picked ? C.danger : 'transparent';
              return (
                <Pressable key={o.t} onPress={() => answer(o)} style={[s.opt, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={s.optText}>{q.kind === 'read' ? o.t : o.pt}</Text>
                </Pressable>
              );
            })}
            {picked && (
              <>
                <Text style={s.p}>
                  {picked === q.answer ? '✅ Isso!' : '❌ Era:'} {q.answer.t} — "{q.answer.say}" = {q.answer.pt}
                </Text>
                <Pressable style={s.btn} onPress={next}>
                  <Text style={s.btnText}>{qi + 1 < quiz.length ? 'Próxima' : 'Ver resultado'}</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    );
  }

  /* ───────── Conteúdo ───────── */
  return (
    <ScrollView contentContainerStyle={s.c}>
      <Stack.Screen options={{ title: `${lesson.emoji} Lição` }} />
      <Text style={s.h1}>{lesson.title}</Text>
      <Text style={s.p}>{lesson.intro}</Text>

      <View style={s.speedRow}>
        <Text style={s.hint}>Velocidade do áudio:</Text>
        <Pressable onPress={() => setSlow(true)} style={[s.chip, slow && s.chipOn]}><Text style={s.chipText}>🐢 Devagar</Text></Pressable>
        <Pressable onPress={() => setSlow(false)} style={[s.chip, !slow && s.chipOn]}><Text style={s.chipText}>🐇 Normal</Text></Pressable>
      </View>

      {rows.map((r) => (
        <Pressable key={r.t + r.pt} style={s.row} onPress={() => play(r.t)}>
          <Ionicons name="volume-high" size={22} color={C.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.t}>{r.t}</Text>
            <Text style={s.say}>🗣️ {r.say}</Text>
            <Text style={s.pt}>{r.pt}</Text>
            {r.note ? <Text style={s.note}>💡 {r.note}</Text> : null}
          </View>
        </Pressable>
      ))}

      <View style={s.tips}>
        <Text style={s.tipsTitle}>Dicas</Text>
        {lesson.tips.map((t, i) => (
          <Text key={i} style={s.tip}>• {t}</Text>
        ))}
        <Text style={[s.tip, { fontStyle: 'italic' }]}>A leitura "🗣️" é uma aproximação com sons do português; o áudio é a referência.</Text>
      </View>

      {lesson.noQuiz ? (
        <Pressable style={s.btn} onPress={finishNoQuiz}>
          <Text style={s.btnText}>{alreadyDone ? 'Concluir de novo (+5 XP)' : `Já ouvi tudo — concluir (+${lesson.xp} XP)`}</Text>
        </Pressable>
      ) : (
        <Pressable style={s.btn} onPress={start}>
          <Text style={s.btnText}>{alreadyDone ? 'Praticar de novo (+10 XP)' : `Praticar e ganhar +${lesson.xp} XP`}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 18, paddingBottom: 60 },
  h1: { color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  p: { color: C.muted, fontSize: 15, lineHeight: 22, marginVertical: 6 },
  hint: { color: C.muted, fontSize: 12 },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.card },
  chipOn: { backgroundColor: C.primary },
  chipText: { color: C.text, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: C.card, padding: 14, borderRadius: 14, marginBottom: 8 },
  t: { color: C.text, fontSize: 18, fontWeight: '800' },
  say: { color: C.accent, fontSize: 14, marginTop: 3 },
  pt: { color: C.muted, fontSize: 13, marginTop: 3 },
  note: { color: C.warn, fontSize: 12, marginTop: 4 },
  tips: { backgroundColor: '#3A2F10', borderRadius: 14, padding: 14, marginTop: 10, gap: 4 },
  tipsTitle: { color: C.warn, fontWeight: '800', marginBottom: 2 },
  tip: { color: '#FDE9B0', fontSize: 14, lineHeight: 20 },
  btn: { backgroundColor: C.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 18 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  count: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  listen: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, padding: 18, borderRadius: 16, marginVertical: 12 },
  opt: { padding: 16, borderRadius: 14, marginTop: 10, borderWidth: 2 },
  optText: { color: C.text, fontSize: 16, fontWeight: '600' },
  result: { alignItems: 'center', gap: 8, paddingTop: 30 },
});
