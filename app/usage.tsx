import { narrow } from '../src/layout';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dayKey } from '../src/levels';
import { PROVIDERS } from '../src/provider';
import { useStore } from '../src/store';
import { C } from '../src/theme';
import { fmtCountdown, fmtNum, hasLimitInfo } from '../src/usage';

function Meter({ label, remaining, limit, resetAt, now }: { label: string; remaining?: number; limit?: number; resetAt?: number; now: number }) {
  if (limit === undefined && remaining === undefined) return null;
  const used = limit !== undefined && remaining !== undefined ? limit - remaining : undefined;
  const pct = limit && remaining !== undefined ? Math.max(0, Math.min(1, remaining / limit)) : 0;
  const color = pct > 0.4 ? C.accent : pct > 0.15 ? C.warn : C.danger;
  return (
    <View style={{ marginTop: 12 }}>
      <View style={s.line}>
        <Text style={s.lbl}>{label}</Text>
        <Text style={s.val}>
          {remaining !== undefined ? fmtNum(remaining) : '?'} restantes{limit !== undefined ? ` de ${fmtNum(limit)}` : ''}
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.max(2, pct * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.sub}>
        {used !== undefined ? `usadas: ${fmtNum(used)} · ` : ''}
        {resetAt ? `zera em ${fmtCountdown(resetAt - now)}` : 'horário de reset não informado'}
      </Text>
    </View>
  );
}

export default function Usage() {
  const { profiles, activeId, settings, rateLimit } = useStore();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const prov = PROVIDERS[settings.provider];
  const rl = rateLimit[settings.provider];
  const blocked = rl?.blockedUntil && rl.blockedUntil > now ? rl.blockedUntil : undefined;
  const today = dayKey();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dayKey(d);
  });
  const sum = (k: 'req' | 'stt' | 'tok', day: string) => profiles.reduce((a, p) => a + (p.usage?.[day]?.[k] ?? 0), 0);
  const max7 = Math.max(1, ...days.map((d) => sum('req', d)));

  return (
    <ScrollView contentContainerStyle={[s.c, narrow]}>
      {blocked && (
        <View style={s.block}>
          <Text style={s.blockTitle}>⛔ Limite atingido</Text>
          <Text style={s.blockText}>Volta a funcionar em {fmtCountdown(blocked - now)}.</Text>
        </View>
      )}

      <Text style={s.section}>COTA DA CHAVE · {prov.label.toUpperCase()}</Text>
      <View style={s.card}>
        {hasLimitInfo(rl) ? (
          <>
            <Meter label="Requisições (por dia)" remaining={rl!.remainingReq} limit={rl!.limitReq} resetAt={rl!.resetReqAt} now={now} />
            <Meter label="Tokens (por minuto)" remaining={rl!.remainingTok} limit={rl!.limitTok} resetAt={rl!.resetTokAt} now={now} />
            <Text style={s.sub}>Atualizado em {new Date(rl!.at).toLocaleTimeString()} (a cada mensagem). Os limites valem para a CHAVE, então vocês dois dividem a mesma cota.</Text>
          </>
        ) : (
          <Text style={s.p}>
            Ainda não recebi os limites do provedor. Envie uma mensagem ao tutor e volte aqui. Se continuar vazio, o navegador pode estar bloqueando a leitura desses dados (comum na versão web) — use o painel oficial abaixo.
          </Text>
        )}
        <Pressable style={s.link} onPress={() => Linking.openURL(settings.provider === 'groq' ? 'https://console.groq.com/settings/limits' : 'https://platform.openai.com/usage')}>
          <Ionicons name="open-outline" size={16} color={C.primary} />
          <Text style={s.linkText}>{settings.provider === 'groq' ? 'Ver limites e uso no console do Groq' : 'Ver uso no painel da OpenAI'}</Text>
        </Pressable>
        <Text style={s.sub}>
          Plano gratuito: há limite diário de requisições e por minuto de tokens, que varia por modelo. Quando acabar, o app mostra o tempo para liberar.
        </Text>
      </View>

      <Text style={s.section}>USO LOCAL DESTE APARELHO</Text>
      <View style={s.card}>
        <View style={s.line}>
          <Text style={s.lbl}>Hoje (todos os perfis)</Text>
          <Text style={s.val}>{sum('req', today)} msgs · {sum('stt', today)} vozes · {fmtNum(sum('tok', today))} tokens</Text>
        </View>
        <Text style={[s.lbl, { marginTop: 14 }]}>Mensagens nos últimos 7 dias</Text>
        <View style={s.bars}>
          {days.map((d) => {
            const v = sum('req', d);
            return (
              <View key={d} style={s.barCol}>
                <Text style={s.barVal}>{v || ''}</Text>
                <View style={[s.bar, { height: Math.max(3, (v / max7) * 60), backgroundColor: d === today ? C.primary : C.cardAlt }]} />
                <Text style={s.barDay}>{d.slice(8)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={s.section}>POR PERFIL (HOJE)</Text>
      {profiles.map((p) => {
        const u = p.usage?.[today] ?? { req: 0, stt: 0, tok: 0 };
        const total = Object.values(p.usage ?? {}).reduce((a, d) => a + d.req, 0);
        return (
          <View key={p.id} style={[s.card, p.id === activeId && { borderColor: C.primary, borderWidth: 1 }, { marginBottom: 8 }]}>
            <View style={s.line}>
              <Text style={s.lbl}>{p.avatar} {p.name}</Text>
              <Text style={s.val}>{u.req} msgs · {u.stt} vozes · {fmtNum(u.tok)} tokens</Text>
            </View>
            <Text style={s.sub}>{total} mensagens nos últimos 30 dias</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 16, paddingBottom: 60 },
  section: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 22, marginBottom: 8 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  lbl: { color: C.text, fontWeight: '700', fontSize: 14, flexShrink: 1 },
  val: { color: C.muted, fontSize: 12, flexShrink: 1, textAlign: 'right' },
  track: { height: 10, borderRadius: 5, backgroundColor: C.cardAlt, marginTop: 6, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  sub: { color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  p: { color: C.muted, fontSize: 14, lineHeight: 20 },
  link: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 12 },
  linkText: { color: C.primary, fontWeight: '600', fontSize: 13 },
  block: { backgroundColor: '#4A1D1D', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.danger },
  blockTitle: { color: '#FECACA', fontWeight: '800', fontSize: 16 },
  blockText: { color: '#FECACA', marginTop: 4 },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, height: 90 },
  barCol: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  bar: { width: 18, borderRadius: 4 },
  barVal: { color: C.muted, fontSize: 10, marginBottom: 2 },
  barDay: { color: C.muted, fontSize: 10, marginTop: 4 },
});
