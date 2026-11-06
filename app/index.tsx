import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ProfileCard from '../src/components/ProfileCard';
import { FREE_ID, isDone, isUnlocked, nextScenario, PHASES, phaseProgress, Scenario } from '../src/curriculum';
import { notify } from '../src/dialog';
import { LANGS, PERSONAS } from '../src/personas';
import { useActiveProfile, useStore } from '../src/store';
import { C } from '../src/theme';
import { Lang, PersonaId } from '../src/types';

export default function Home() {
  const router = useRouter();
  const profile = useActiveProfile();
  const { updateProfile, effectiveKey } = useStore();
  const hasKey = useStore((s) => !!s.effectiveKey(s.activeId));
  void effectiveKey;

  if (!profile) return <Redirect href="/profile-edit?first=1" />;

  const open = (sc: Scenario, persona?: PersonaId) => {
    if (!isUnlocked(profile, sc.id)) {
      return notify('Fase bloqueada 🔒', 'Conclua o cenário anterior para liberar este. (Dá para liberar tudo em Perfis → editar.)');
    }
    router.push({ pathname: '/chat', params: { scenario: sc.id, persona: persona ?? 'friend' } });
  };

  const next = nextScenario(profile);

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.topRow}>
        <View style={{ flex: 1 }}>
          <ProfileCard profile={profile} onPress={() => router.push('/profiles')} right={<Ionicons name="swap-horizontal" size={22} color={C.muted} />} />
        </View>
      </View>
      <View style={s.tools}>
        <Pressable style={s.tool} onPress={() => router.push('/vocab')}>
          <Ionicons name="book" size={18} color={C.text} />
          <Text style={s.toolText}>Vocabulário ({profile.vocab.filter((v) => v.lang === profile.lang).length})</Text>
        </Pressable>
        <Pressable style={s.tool} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-sharp" size={18} color={C.text} />
          <Text style={s.toolText}>Configurações</Text>
        </Pressable>
      </View>

      {!hasKey && (
        <Pressable style={s.warn} onPress={() => router.push('/settings')}>
          <Ionicons name="key" size={18} color={C.warn} />
          <Text style={s.warnText}>Falta a chave de API (grátis no Groq). Toque para configurar.</Text>
        </Pressable>
      )}

      <Text style={s.label}>IDIOMA DE TREINO</Text>
      <View style={s.row}>
        {(Object.keys(LANGS) as Lang[]).map((l) => {
          const on = profile.lang === l;
          return (
            <Pressable key={l} onPress={() => updateProfile(profile.id, { lang: l })} style={[s.langBtn, on && s.langOn]}>
              <Text style={{ fontSize: 26 }}>{LANGS[l].flag}</Text>
              <Text style={[s.langText, on && { color: '#fff' }]}>{LANGS[l].label}</Text>
            </Pressable>
          );
        })}
      </View>

      {next && (
        <Pressable style={s.cta} onPress={() => open(next)}>
          <Ionicons name="play" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={s.ctaSmall}>Continuar a trilha</Text>
            <Text style={s.ctaText}>{next.emoji} {next.title}</Text>
          </View>
        </Pressable>
      )}

      {PHASES.map((ph) => {
        const prog = phaseProgress(profile, ph);
        return (
          <View key={ph.id}>
            <View style={s.phaseHead}>
              <Text style={s.phaseTitle}>{ph.emoji} {ph.title}</Text>
              <Text style={s.phaseCount}>{prog.done}/{prog.total}</Text>
            </View>
            <Text style={s.phaseSub}>{ph.subtitle}</Text>
            {ph.scenarios.map((sc) => {
              const unlocked = isUnlocked(profile, sc.id);
              const done = isDone(profile, sc.id);
              return (
                <Pressable key={sc.id} onPress={() => open(sc)} style={[s.card, !unlocked && { opacity: 0.5 }]}>
                  <Text style={{ fontSize: 28 }}>{sc.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{sc.title}</Text>
                    <Text style={s.cardSub}>{sc.desc} · +{sc.xpReward} XP</Text>
                  </View>
                  <Ionicons
                    name={done ? 'checkmark-circle' : unlocked ? 'chevron-forward' : 'lock-closed'}
                    size={22}
                    color={done ? C.accent : C.muted}
                  />
                </Pressable>
              );
            })}
            {ph.id === 4 && (
              <View style={[s.card, { flexDirection: 'column', alignItems: 'stretch', opacity: isUnlocked(profile, FREE_ID) ? 1 : 0.5 }]}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 28 }}>💬</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>Modo Chat Livre</Text>
                    <Text style={s.cardSub}>Prática aberta, sem roteiro. Escolha o tutor:</Text>
                  </View>
                  {!isUnlocked(profile, FREE_ID) && <Ionicons name="lock-closed" size={20} color={C.muted} />}
                </View>
                <View style={[s.row, { marginTop: 10, flexWrap: 'wrap' }]}>
                  {(Object.keys(PERSONAS) as PersonaId[]).map((id) => (
                    <Pressable key={id} style={s.chip} onPress={() => open({ id: FREE_ID } as Scenario, id)}>
                      <Text style={s.chipText}>{PERSONAS[id].emoji} {PERSONAS[id].names[profile.lang].split(' (')[0]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, paddingBottom: 50 },
  topRow: { flexDirection: 'row' },
  tools: { flexDirection: 'row', gap: 10, marginTop: 10 },
  tool: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: C.card },
  toolText: { color: C.text, fontWeight: '600', fontSize: 13 },
  label: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: 'transparent' },
  langOn: { borderColor: C.primary, backgroundColor: C.primary + '33' },
  langText: { color: C.muted, fontWeight: '700', fontSize: 15 },
  cta: { marginTop: 16, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.primary, padding: 16, borderRadius: 16 },
  ctaSmall: { color: '#DDE1FF', fontSize: 12, fontWeight: '600' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  phaseHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  phaseTitle: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1 },
  phaseCount: { color: C.accent, fontWeight: '800' },
  phaseSub: { color: C.muted, fontSize: 13, marginBottom: 10, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: C.card, marginBottom: 8 },
  cardTitle: { color: C.text, fontWeight: '700', fontSize: 15 },
  cardSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: C.cardAlt },
  chipText: { color: C.text, fontSize: 13, fontWeight: '600' },
  warn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#3A2F10', padding: 12, borderRadius: 12, marginTop: 12 },
  warnText: { color: '#FDE9B0', flex: 1, fontSize: 13 },
});
