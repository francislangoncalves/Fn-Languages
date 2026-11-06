import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { ChatMessage } from '../types';

interface Props {
  msg: ChatMessage;
  onReplay?: (text: string, slow?: boolean) => void;
  /** Nível avançado: esconde o texto do tutor até o aluno pedir (treino de escuta) */
  hideText?: boolean;
}

export default function MessageBubble({ msg, onReplay, hideText }: Props) {
  const [showTr, setShowTr] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [showPron, setShowPron] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [revealed, setRevealed] = useState(!hideText);

  if (msg.role === 'user') {
    return (
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <View style={[styles.bubble, styles.user]}>
          <Text style={styles.userText}>{msg.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={{ maxWidth: '88%' }}>
        {msg.correction ? (
          <Pressable onPress={() => setShowFix((v) => !v)} style={styles.fix}>
            <View style={styles.fixHead}>
              <Ionicons name="bulb" size={16} color={C.warn} />
              <Text style={styles.fixTitle}>Dica de Gramática / Correção</Text>
              <Ionicons name={showFix ? 'chevron-up' : 'chevron-down'} size={16} color={C.warn} />
            </View>
            {showFix && <Text style={styles.fixBody}>{msg.correction}</Text>}
          </Pressable>
        ) : null}

        <View style={[styles.bubble, styles.bot]}>
          {revealed ? (
            <Text style={styles.botText}>{msg.text}</Text>
          ) : (
            <Pressable onPress={() => setRevealed(true)}>
              <Text style={[styles.botText, { color: C.muted }]}>🎧 Modo escuta — toque para revelar o texto</Text>
            </Pressable>
          )}
          {revealed && msg.guide ? (
            <Pressable onPress={() => setShowGuide((v) => !v)}>
              <Text style={styles.guide}>{showGuide ? `🗣️ ${msg.guide}` : '🗣️ Como ler (toque)'}</Text>
            </Pressable>
          ) : null}
          {showTr && <Text style={styles.tr}>{msg.translation || '—'}</Text>}
        </View>

        {msg.pronunciation ? (
          <Pressable onPress={() => setShowPron((v) => !v)} style={styles.pron}>
            <View style={styles.fixHead}>
              <Ionicons name="mic-circle" size={16} color={C.accent} />
              <Text style={[styles.fixTitle, { color: C.accent }]}>Dica de pronúncia</Text>
              <Ionicons name={showPron ? 'chevron-up' : 'chevron-down'} size={16} color={C.accent} />
            </View>
            {showPron && <Text style={styles.pronBody}>{msg.pronunciation}</Text>}
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          <Pressable onPress={() => onReplay?.(msg.text)} style={styles.chip} hitSlop={6}>
            <Ionicons name="volume-high" size={14} color={C.muted} />
            <Text style={styles.chipText}>Ouvir</Text>
          </Pressable>
          <Pressable onPress={() => onReplay?.(msg.text, true)} style={styles.chip} hitSlop={6}>
            <Text style={styles.chipText}>🐢 Devagar</Text>
          </Pressable>
          <Pressable onPress={() => setShowTr((v) => !v)} style={styles.chip} hitSlop={6}>
            <Ionicons name="language" size={14} color={C.muted} />
            <Text style={styles.chipText}>{showTr ? 'Ocultar tradução' : 'Traduzir para Português'}</Text>
          </Pressable>
          {msg.xp ? <Text style={styles.xp}>+{msg.xp} XP</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 12 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  user: { backgroundColor: C.userBubble, maxWidth: '85%', borderBottomRightRadius: 4 },
  userText: { color: '#fff', fontSize: 16, lineHeight: 22 },
  bot: { backgroundColor: C.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  botText: { color: C.text, fontSize: 16, lineHeight: 22 },
  guide: { color: C.accent, fontSize: 14, lineHeight: 20, marginTop: 6, fontStyle: 'italic' },
  tr: { color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: C.cardAlt },
  chipText: { color: C.muted, fontSize: 12 },
  xp: { color: C.accent, fontWeight: '800', fontSize: 12, alignSelf: 'center' },
  pron: { backgroundColor: '#10302A', borderColor: C.accent + '66', borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 6 },
  pronBody: { color: '#C9F5E4', fontSize: 14, lineHeight: 20, marginTop: 8 },
  fix: { backgroundColor: '#3A2F10', borderColor: C.warn + '66', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 6 },
  fixHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fixTitle: { color: C.warn, fontWeight: '700', fontSize: 13, flex: 1 },
  fixBody: { color: '#FDE9B0', fontSize: 14, lineHeight: 20, marginTop: 8 },
});
