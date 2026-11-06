import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BAND_INFO, bandOf, levelProgress, liveStreak } from '../levels';
import { LANGS } from '../personas';
import { C } from '../theme';
import { Profile } from '../types';

export default function ProfileCard({ profile, onPress, right, active }: { profile: Profile; onPress?: () => void; right?: React.ReactNode; active?: boolean }) {
  const lp = levelProgress(profile.xp);
  const band = BAND_INFO[bandOf(lp.level)];
  const streak = liveStreak(profile.lastPractice, profile.streak);
  return (
    <Pressable onPress={onPress} style={[s.card, active && s.active]}>
      <View style={s.avatar}>
        <Text style={{ fontSize: 34 }}>{profile.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.line}>
          <Text style={s.name} numberOfLines={1}>{profile.name}</Text>
          <Text style={s.flag}>{LANGS[profile.lang].flag}</Text>
          <Text style={s.streak}>🔥 {streak}</Text>
        </View>
        <Text style={s.sub}>
          Nível {lp.level} · {band.label} ({band.cefr})
        </Text>
        <View style={s.track}>
          <View style={[s.fill, { width: `${Math.max(3, lp.pct * 100)}%` }]} />
        </View>
        <Text style={s.xp}>{lp.into} / {lp.need} XP · total {profile.xp}</Text>
      </View>
      {right}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: C.card, borderWidth: 2, borderColor: 'transparent' },
  active: { borderColor: C.primary },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.cardAlt, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: C.text, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  flag: { fontSize: 16 },
  streak: { color: C.warn, fontWeight: '700', marginLeft: 'auto' },
  sub: { color: C.muted, fontSize: 12, marginTop: 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: C.cardAlt, marginTop: 8, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.accent },
  xp: { color: C.muted, fontSize: 11, marginTop: 4 },
});
