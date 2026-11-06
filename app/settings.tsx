import React, { useEffect, useState } from 'react';
import { narrow } from '../src/layout';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { confirmAction, notify } from '../src/dialog';
import { validateKey } from '../src/openai';
import { PROVIDERS, ProviderId } from '../src/provider';
import { Settings, useStore } from '../src/store';
import { C } from '../src/theme';

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={s.seg}>
      {options.map((o) => (
        <Pressable key={o.v} onPress={() => onChange(o.v)} style={[s.segBtn, value === o.v && s.segOn]}>
          <Text style={[s.segText, value === o.v && { color: '#fff' }]}>{o.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {hint ? <Text style={s.hint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.primary }} />
    </View>
  );
}

export default function SettingsScreen() {
  const { globalKey: apiKey, setGlobalKey: setApiKey, settings, updateSettings, activeId, clearAllChats } = useStore();
  const [key, setKey] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const prov = PROVIDERS[settings.provider];
  useEffect(() => setKey(apiKey), [apiKey, settings.provider]);
  const up = <K extends keyof Settings>(k: K) => (v: Settings[K]) => updateSettings({ [k]: v } as Partial<Settings>);

  async function save() {
    const k = key.trim();
    if (!k) {
      await setApiKey('');
      return notify('Chave removida');
    }
    setBusy(true);
    try {
      await validateKey(k);
      await setApiKey(k);
      notify('Pronto ✅', 'Chave válida e salva com segurança neste aparelho.');
    } catch (e: any) {
      notify('Não foi possível validar', e?.message ?? 'Erro de rede');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[s.c, narrow]} keyboardShouldPersistTaps="handled">
      <Text style={s.section}>PROVEDOR DE IA</Text>
      <Seg
        value={settings.provider}
        onChange={(v: ProviderId) => updateSettings({ provider: v })}
        options={[{ v: 'groq', l: 'Groq (grátis)' }, { v: 'openai', l: 'OpenAI (pago)' }]}
      />
      {prov.free && (
        <View style={s.guide}>
          <Text style={s.guideTitle}>Como pegar a chave grátis (2 min)</Text>
          <Text style={s.guideStep}>1. Toque no botão abaixo e entre no Groq com Google/GitHub/e-mail (sem cartão).</Text>
          <Text style={s.guideStep}>2. Clique em "Create API Key", dê um nome e copie a chave (começa com gsk_).</Text>
          <Text style={s.guideStep}>3. Volte aqui, cole no campo abaixo e toque em "Validar e salvar".</Text>
          <Pressable style={[s.btn, { marginTop: 10 }]} onPress={() => Linking.openURL(prov.keyUrl)}>
            <Text style={s.btnText}>Abrir console.groq.com/keys</Text>
          </Pressable>
        </View>
      )}
      {!prov.free && (
        <Pressable style={[s.btn, { marginTop: 10, backgroundColor: C.cardAlt }]} onPress={() => Linking.openURL(prov.keyUrl)}>
          <Text style={s.btnText}>Abrir platform.openai.com/api-keys (pago)</Text>
        </Pressable>
      )}

      <Text style={s.section}>CHAVE GLOBAL · {prov.label.toUpperCase()}</Text>
      <TextInput
        style={s.input}
        value={key}
        onChangeText={setKey}
        placeholder={prov.keyHint}
        placeholderTextColor={C.muted}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!show}
      />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Pressable style={[s.btn, { flex: 1 }]} onPress={save} disabled={busy}>
          <Text style={s.btnText}>{busy ? 'Validando…' : 'Validar e salvar'}</Text>
        </Pressable>
        <Pressable style={[s.btn, { backgroundColor: C.cardAlt }]} onPress={() => setShow((v) => !v)}>
          <Text style={s.btnText}>{show ? 'Ocultar' : 'Mostrar'}</Text>
        </Pressable>
      </View>
      <Text style={s.hint}>Usada pelos perfis que não têm chave própria (defina uma por perfil em Perfis → editar). Fica no cofre seguro do aparelho e só é enviada ao provedor escolhido.</Text>

      {prov.id === 'openai' ? (
        <>
          <Text style={s.section}>MODELO</Text>
          <Seg value={settings.model} onChange={up('model')} options={[{ v: 'gpt-4o-mini', l: 'GPT-4o mini' }, { v: 'gpt-4o', l: 'GPT-4o' }]} />
        </>
      ) : (
        <Text style={s.hint}>Modelo: Llama 3.3 70B (chat) + Whisper large-v3-turbo (sua voz). A voz do tutor usa a voz do aparelho/navegador.</Text>
      )}

      <Text style={s.section}>VOZ DO TUTOR</Text>
      {prov.hasTts ? (
        <Seg value={settings.voiceEngine} onChange={up('voiceEngine')} options={[{ v: 'openai', l: 'OpenAI (realista)' }, { v: 'device', l: 'Voz do aparelho' }]} />
      ) : (
        <Text style={s.hint}>Voz do aparelho (gratuita).</Text>
      )}
      {prov.hasTts && settings.voiceEngine === 'openai' && (
        <>
          <View style={{ height: 10 }} />
          <View style={s.wrap}>
            {(['alloy', 'echo', 'nova', 'shimmer', 'onyx', 'fable'] as const).map((v) => (
              <Pressable key={v} onPress={() => updateSettings({ voice: v })} style={[s.pill, settings.voice === v && s.segOn]}>
                <Text style={[s.segText, settings.voice === v && { color: '#fff' }]}>{v}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Toggle label="Falar respostas automaticamente" value={settings.autoSpeak} onChange={up('autoSpeak')} />

      <Text style={s.section}>MICROFONE</Text>
      <Seg value={settings.recordMode} onChange={up('recordMode')} options={[{ v: 'hold', l: 'Segurar para falar' }, { v: 'tap', l: 'Tocar para gravar' }]} />
      <Toggle
        label="Revisar o texto antes de enviar"
        hint="Depois de falar, o texto reconhecido aparece na caixa para você corrigir. Ignorado no modo hands-free."
        value={settings.reviewTranscript}
        onChange={up('reviewTranscript')}
      />
      <Toggle
        label="Modo hands-free"
        hint="Depois que o tutor fala, o microfone abre sozinho e envia quando você faz silêncio."
        value={settings.handsFree}
        onChange={up('handsFree')}
      />

      <Pressable
        style={[s.btn, { backgroundColor: '#5B1F1F', marginTop: 28 }]}
        onPress={() =>
          confirmAction('Apagar histórico?', 'As conversas do perfil ativo serão removidas (XP e vocabulário são mantidos).', 'Apagar', () => activeId && clearAllChats(activeId))
        }
      >
        <Text style={s.btnText}>Apagar histórico de conversas do perfil ativo</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 20, paddingBottom: 60 },
  section: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  input: { backgroundColor: C.card, color: C.text, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: C.border },
  btn: { backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  guide: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: C.primary + '66' },
  guideTitle: { color: C.text, fontWeight: '800', marginBottom: 6 },
  guideStep: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  hint: { color: C.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  seg: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  segOn: { backgroundColor: C.primary },
  segText: { color: C.muted, fontWeight: '600' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 },
  rowLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
});
