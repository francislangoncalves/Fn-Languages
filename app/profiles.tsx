import { narrow } from '../src/layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ProfileCard from '../src/components/ProfileCard';
import { notify } from '../src/dialog';
import { MAX_PROFILES, useStore } from '../src/store';
import { C } from '../src/theme';

export default function Profiles() {
  const router = useRouter();
  const { profiles, activeId, setActive } = useStore();

  return (
    <ScrollView contentContainerStyle={[s.c, narrow]}>
      <Text style={s.count}>{profiles.length}/{MAX_PROFILES} perfis · cada um com progresso, histórico e chave próprios</Text>
      {profiles.map((p) => (
        <View key={p.id} style={{ marginBottom: 10 }}>
          <ProfileCard
            profile={p}
            active={p.id === activeId}
            onPress={() => {
              setActive(p.id);
              router.replace('/');
            }}
            right={
              <Pressable hitSlop={10} onPress={() => router.push({ pathname: '/profile-edit', params: { id: p.id } })}>
                <Ionicons name="create-outline" size={22} color={C.muted} />
              </Pressable>
            }
          />
        </View>
      ))}
      <Pressable
        style={[s.add, profiles.length >= MAX_PROFILES && { opacity: 0.4 }]}
        onPress={() => (profiles.length >= MAX_PROFILES ? notify('Limite atingido', `Você pode ter no máximo ${MAX_PROFILES} perfis. Exclua um para criar outro.`) : router.push('/profile-edit'))}
      >
        <Ionicons name="person-add" size={20} color="#fff" />
        <Text style={s.addText}>Novo perfil</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 16, paddingBottom: 50 },
  count: { color: C.muted, fontSize: 12, marginBottom: 14 },
  add: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: C.primary, padding: 16, borderRadius: 16, marginTop: 6 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
