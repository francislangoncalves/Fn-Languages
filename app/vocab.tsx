import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { speak } from '../src/audio';
import { BAND_INFO, bandOf, levelFromXp } from '../src/levels';
import { useActiveProfile, useStore } from '../src/store';
import { C } from '../src/theme';

export default function Vocab() {
  const profile = useActiveProfile();
  const { settings, toggleLearned, effectiveKey } = useStore();
  const [onlyPending, setOnlyPending] = useState(false);
  if (!profile) return null;

  const items = profile.vocab.filter((v) => v.lang === profile.lang && (!onlyPending || !v.learned));
  const speed = BAND_INFO[bandOf(levelFromXp(profile.xp))].speed;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.head}>
        <Text style={s.title}>
          {items.length} {items.length === 1 ? 'palavra' : 'palavras'}
        </Text>
        <Pressable onPress={() => setOnlyPending((v) => !v)} style={[s.chip, onlyPending && { backgroundColor: C.primary }]}>
          <Text style={s.chipText}>{onlyPending ? 'Só não aprendidas' : 'Todas'}</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(v) => v.lang + v.term}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        ListEmptyComponent={<Text style={s.empty}>Nenhuma palavra ainda. Converse com o tutor — novas expressões aparecem aqui automaticamente.</Text>}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Pressable onPress={() => speak(item.term, item.lang, settings, effectiveKey(profile.id), speed)} hitSlop={8}>
              <Ionicons name="volume-high" size={22} color={C.primary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[s.term, item.learned && { textDecorationLine: 'line-through', color: C.muted }]}>{item.term}</Text>
              <Text style={s.meaning}>{item.meaning}</Text>
            </View>
            <Pressable onPress={() => toggleLearned(profile.id, item.term, item.lang)} hitSlop={8}>
              <Ionicons name={item.learned ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={item.learned ? C.accent : C.muted} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { color: C.text, fontSize: 18, fontWeight: '800' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: C.card },
  chipText: { color: C.text, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, padding: 14, borderRadius: 14, marginBottom: 8 },
  term: { color: C.text, fontSize: 16, fontWeight: '700' },
  meaning: { color: C.muted, fontSize: 13, marginTop: 2 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 40, lineHeight: 20 },
});
