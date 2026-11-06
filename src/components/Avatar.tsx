import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { AvatarState } from '../types';

const STATE_INFO: Record<AvatarState, { color: string; label: string }> = {
  idle: { color: C.primary, label: 'Pronto para conversar' },
  listening: { color: C.accent, label: 'Ouvindo…' },
  thinking: { color: C.warn, label: 'Pensando…' },
  speaking: { color: '#F472B6', label: 'Falando…' },
};

export default function Avatar({ emoji, state, level = 0 }: { emoji: string; state: AvatarState; level?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.stopAnimation();
    spin.stopAnimation();
    bounce.stopAnimation();
    pulse.setValue(0);
    spin.setValue(0);
    bounce.setValue(0);

    if (state === 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else if (state === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 320, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 450, useNativeDriver: true }),
        ])
      ).start();
    } else if (state === 'thinking') {
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })).start();
    }
  }, [state]);

  const { color, label } = STATE_INFO[state];
  const ringScale =
    state === 'listening'
      ? 1 + level * 0.35
      : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, state === 'speaking' ? 1.22 : 1.08] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const faceY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Animated.View style={[styles.ring, { borderColor: color, backgroundColor: color + '22', transform: [{ scale: ringScale as any }] }]} />
        {state === 'thinking' && (
          <Animated.View style={[styles.orbit, { transform: [{ rotate }] }]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
          </Animated.View>
        )}
        <Animated.View style={[styles.face, { borderColor: color, transform: [{ translateY: faceY }] }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </Animated.View>
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  stage: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 2 },
  orbit: { position: 'absolute', width: 120, height: 120, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  face: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.card, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 44 },
  label: { marginTop: 4, fontSize: 13, fontWeight: '600' },
});
