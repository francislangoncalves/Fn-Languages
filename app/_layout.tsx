import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useStore } from '../src/store';
import { C } from '../src/theme';

export default function RootLayout() {
  const { ready, load } = useStore();
  useEffect(() => {
    load();
  }, []);

  if (!ready)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Lingua Tutor' }} />
        <Stack.Screen name="chat" options={{ title: 'Conversa' }} />
        <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
        <Stack.Screen name="profiles" options={{ title: 'Perfis' }} />
        <Stack.Screen name="profile-edit" options={{ title: 'Perfil' }} />
        <Stack.Screen name="vocab" options={{ title: 'Vocabulário' }} />
        <Stack.Screen name="usage" options={{ title: 'Uso e limites' }} />
        <Stack.Screen name="lesson" options={{ title: 'Lição' }} />
      </Stack>
    </>
  );
}
