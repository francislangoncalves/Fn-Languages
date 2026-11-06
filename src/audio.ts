import { Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { arrayBufferToBase64 } from './b64';
import { synthesize } from './openai';
import { LANGS } from './personas';
import { getProvider } from './provider';
import { Settings } from './store';
import { Lang } from './types';

async function setPlaybackMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
}

/* ───────────── TTS ───────────── */

let currentSound: Audio.Sound | null = null;
let speakToken = 0;
const cache = new Map<string, string>(); // chave -> uri mp3

export async function stopSpeaking() {
  speakToken++;
  Speech.stop();
  if (currentSound) {
    const s = currentSound;
    currentSound = null;
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch {}
  }
}

/** Fala o texto e resolve quando termina (ou é interrompido). */
export async function speak(text: string, lang: Lang, settings: Settings, apiKey: string, speed = 1): Promise<void> {
  await stopSpeaking();
  const token = speakToken;
  await setPlaybackMode();

  if (settings.voiceEngine === 'device' || !getProvider().hasTts) return speakDevice(text, lang, speed);

  try {
    const ck = `${settings.voice}|${speed}|${text}`;
    let uri = cache.get(ck);
    if (!uri) {
      const buf = await synthesize(apiKey, text, settings.voice, speed);
      if (Platform.OS === 'web') {
        uri = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
      } else {
        uri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(uri, arrayBufferToBase64(buf), {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      cache.set(ck, uri);
    }
    if (token !== speakToken) return;
    const src: string = uri;
    await new Promise<void>(async (resolve) => {
      const { sound } = await Audio.Sound.createAsync({ uri: src }, { shouldPlay: true });
      currentSound = sound;
      sound.setOnPlaybackStatusUpdate((st: AVPlaybackStatus) => {
        if (st.isLoaded && st.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (currentSound === sound) currentSound = null;
          resolve();
        }
      });
    });
  } catch {
    // Falha de rede/TTS: cai para a voz nativa do aparelho
    if (token === speakToken) await speakDevice(text, lang, speed);
  }
}

function speakDevice(text: string, lang: Lang, speed = 1): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: LANGS[lang].speechLocale,
      rate: 0.92 * speed,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

/* ───────────── Gravação ───────────── */

export async function ensureMicPermission(): Promise<boolean> {
  const cur = await Audio.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Audio.requestPermissionsAsync();
  return req.granted;
}

export interface RecorderOpts {
  /** Hands-free: para sozinho quando o usuário fica em silêncio após falar */
  autoStopOnSilence?: boolean;
  onAutoStop?: () => void;
  onLevel?: (level01: number) => void;
}

let recording: Audio.Recording | null = null;
let webMeter: { stop: () => void } | null = null;

/** Na web o expo-av não fornece metering: mede o volume via AnalyserNode. */
async function startWebMeter(onDb: (db: number) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new AC();
  const an = ctx.createAnalyser();
  an.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(an);
  const buf = new Float32Array(an.fftSize);
  const id = setInterval(() => {
    an.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    onDb(rms > 0 ? 20 * Math.log10(rms) : -160);
  }, 150);
  return {
    stop() {
      clearInterval(id);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
    },
  };
}

export async function startRecording(opts: RecorderOpts = {}): Promise<void> {
  await stopSpeaking();
  if (recording) await cancelRecording();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

  const isWeb = Platform.OS === 'web';
  const rec = new Audio.Recording();
  const preset: any = { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true };
  if (isWeb) {
    // Safari não grava webm: escolhe o formato suportado pelo navegador
    const MR = (window as any).MediaRecorder;
    const mimeType = MR?.isTypeSupported?.('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/mp4';
    preset.web = { mimeType, bitsPerSecond: 128000 };
  }
  await rec.prepareToRecordAsync(preset);

  let heardSpeech = false;
  let silentSince = 0;
  const startedAt = Date.now();
  const handleDb = (db: number) => {
    opts.onLevel?.(Math.max(0, Math.min(1, (db + 60) / 60))); // db: -160 (silêncio) .. 0
    const now = Date.now();
    if (opts.autoStopOnSilence) {
      if (db > -38) {
        heardSpeech = true;
        silentSince = 0;
      } else if (heardSpeech) {
        if (!silentSince) silentSince = now;
        if (now - silentSince > 1600) opts.onAutoStop?.();
      } else if (now - startedAt > 8000) {
        opts.onAutoStop?.(); // ninguém falou: encerra
      }
    }
    if (now - startedAt > 45000) opts.onAutoStop?.();
  };

  if (isWeb) {
    try {
      webMeter = await startWebMeter(handleDb);
    } catch {}
  } else {
    rec.setProgressUpdateInterval(150);
    rec.setOnRecordingStatusUpdate((st) => {
      if (st.isRecording) handleDb(st.metering ?? -160);
    });
  }
  await rec.startAsync();
  recording = rec;
}

function stopMeter() {
  webMeter?.stop();
  webMeter = null;
}

/** Para e devolve a URI do áudio (ou null se muito curto). */
export async function stopRecording(): Promise<string | null> {
  const rec = recording;
  stopMeter();
  if (!rec) return null;
  recording = null;
  try {
    const st = await rec.getStatusAsync();
    await rec.stopAndUnloadAsync();
    await setPlaybackMode();
    if ((st.durationMillis ?? 0) < 500) return null;
    return rec.getURI();
  } catch {
    return null;
  }
}

export async function cancelRecording() {
  const rec = recording;
  recording = null;
  stopMeter();
  if (rec) {
    try {
      await rec.stopAndUnloadAsync();
    } catch {}
  }
  await setPlaybackMode().catch(() => {});
}
