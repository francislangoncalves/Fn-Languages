import { narrow } from '../src/layout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { confirmAction, notify } from '../src/dialog';
import { LANGS } from '../src/personas';
import { useStore } from '../src/store';
import { C } from '../src/theme';
import { Field, Lang } from '../src/types';

const AVATARS = ['🦊', '🐼', '🦉', '🐯', '🐸', '🦁', '🐙', '🦄', '🚀', '🎧', '💻', '🌟', '🍕', '⚽', '🎸', '🌍'];

export default function ProfileEdit() {
  const { id, first } = useLocalSearchParams<{ id?: string; first?: string }>();
  const router = useRouter();
  const { profiles, ownKeys, createProfile, updateProfile, setOwnKey, deleteProfile } = useStore();
  const existing = profiles.find((p) => p.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [avatar, setAvatar] = useState(existing?.avatar ?? AVATARS[0]);
  const [lang, setLang] = useState<Lang>(existing?.lang ?? 'en');
  const [field, setField] = useState<Field>(existing?.field ?? 'tech');
  const [useOwn, setUseOwn] = useState(existing?.useOwnKey ?? false);
  const [key, setKey] = useState(existing ? ownKeys[existing.id] ?? '' : '');
  const [unlockAll, setUnlockAll] = useState(existing?.unlockAll ?? false);

  async function save() {
    if (!name.trim()) return notify('Dê um nome ao perfil');
    if (existing) {
      updateProfile(existing.id, { name: name.trim(), avatar, lang, field, useOwnKey: useOwn, unlockAll });
      await setOwnKey(existing.id, key);
      router.back();
    } else {
      const nid = await createProfile({ name, avatar, lang, field, useOwnKey: useOwn, unlockAll }, key);
      if (!nid) return notify('Limite de 5 perfis atingido');
      router.replace('/');
    }
  }

  return (
    <ScrollView contentContainerStyle={[s.c, narrow]} keyboardShouldPersistTaps="handled">
      {first ? <Text style={s.hello}>Bem-vindo! 👋 Crie seu primeiro perfil para começar a trilha.</Text> : null}

      <Text style={s.label}>NOME</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ex.: Francisco" placeholderTextColor={C.muted} maxLength={20} />

      <Text style={s.label}>AVATAR</Text>
      <View style={s.grid}>
        {AVATARS.map((a) => (
          <Pressable key={a} onPress={() => setAvatar(a)} style={[s.av, avatar === a && s.avOn]}>
            <Text style={{ fontSize: 28 }}>{a}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>IDIOMA FOCO</Text>
      <View style={s.seg}>
        {(Object.keys(LANGS) as Lang[]).map((l) => (
          <Pressable key={l} onPress={() => setLang(l)} style={[s.segBtn, lang === l && s.segOn]}>
            <Text style={[s.segText, lang === l && { color: '#fff' }]}>{LANGS[l].flag} {LANGS[l].label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>EM QUAL ÁREA VOCÊ TRABALHA?</Text>
      <View style={s.seg}>
        {([['tech', '💻 Tecnologia (TI)'], ['pedagogy', '📚 Pedagogia']] as [Field, string][]).map(([f, l]) => (
          <Pressable key={f} onPress={() => setField(f)} style={[s.segBtn, field === f && s.segOn]}>
            <Text style={[s.segText, field === f && { color: '#fff' }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.hint}>Personaliza a Fase 3 (entrevistas, rotina de trabalho) e os exemplos do tutor para a sua área.</Text>

      <Text style={s.label}>CHAVE DE API</Text>
      <View style={s.toggle}>
        <View style={{ flex: 1 }}>
          <Text style={s.tTitle}>Usar chave própria deste perfil</Text>
          <Text style={s.hint}>Desligado = usa a chave global do provedor (Configurações).</Text>
        </View>
        <Switch value={useOwn} onValueChange={setUseOwn} trackColor={{ true: C.primary }} />
      </View>
      {useOwn && (
        <TextInput style={[s.input, { marginTop: 10 }]} value={key} onChangeText={setKey} placeholder="gsk_... ou sk-..." placeholderTextColor={C.muted} autoCapitalize="none" autoCorrect={false} secureTextEntry />
      )}

      <Text style={s.label}>TRILHA</Text>
      <View style={s.toggle}>
        <View style={{ flex: 1 }}>
          <Text style={s.tTitle}>Liberar todas as fases</Text>
          <Text style={s.hint}>Para quem já tem experiência e quer pular a ordem da trilha.</Text>
        </View>
        <Switch value={unlockAll} onValueChange={setUnlockAll} trackColor={{ true: C.primary }} />
      </View>

      <Pressable style={s.save} onPress={save}>
        <Text style={s.saveText}>{existing ? 'Salvar' : 'Criar perfil'}</Text>
      </Pressable>

      {existing && (
        <Pressable
          style={[s.save, { backgroundColor: '#5B1F1F', marginTop: 12 }]}
          onPress={() =>
            confirmAction('Excluir perfil?', `Todo o progresso, histórico e vocabulário de "${existing.name}" serão apagados.`, 'Excluir', async () => {
              await deleteProfile(existing.id);
              router.replace('/');
            })
          }
        >
          <Text style={s.saveText}>Excluir perfil</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 20, paddingBottom: 60 },
  hello: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  label: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 22, marginBottom: 8 },
  input: { backgroundColor: C.card, color: C.text, borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: C.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  av: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avOn: { borderColor: C.primary, backgroundColor: C.primary + '33' },
  seg: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  segOn: { backgroundColor: C.primary },
  segText: { color: C.muted, fontWeight: '600' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tTitle: { color: C.text, fontWeight: '600', fontSize: 15 },
  hint: { color: C.muted, fontSize: 12, marginTop: 2 },
  save: { backgroundColor: C.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 28 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
