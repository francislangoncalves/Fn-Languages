# Lingua Tutor 🗣️

App mobile (Android + iOS) em React Native / Expo para praticar **Inglês** e **Polonês** conversando com um tutor de IA, por voz ou texto.

## 🌐 Versão web / PWA (Vercel)

O projeto já está pronto para deploy: `vercel.json` define build (`npm run build:web`) e saída (`dist`).

**Opção A — pelo GitHub (mais fácil):** suba esta pasta para um repositório → vercel.com → *Add New Project* → importe o repositório → *Deploy* (sem mudar nada).

**Opção B — pela CLI:**
```bash
npm i -g vercel
vercel --prod
```

Depois abra a URL `https://…vercel.app` no celular, entre em **Configurações**, cole sua chave da OpenAI e use "Adicionar à tela inicial" (iOS: Safari → Compartilhar; Android: Chrome → Instalar app).

Notas da web:
- Microfone exige HTTPS (a Vercel já fornece).
- A chave fica no `localStorage` do navegador de quem usa (não há cofre seguro na web). Cada pessoa usa a própria chave; não coloque uma chave sua no código.
- No iOS Safari, o áudio automático pode ser bloqueado até você tocar na tela uma vez; o botão "Ouvir" sempre funciona.
- Testar local: `npm run build:web && npx serve dist -s`

## Rodando no celular (Expo Go)

```bash
npm install
npx expo start
```
Abra no **Expo Go** (escaneie o QR code) ou use `npm run android` / `npm run ios`.
Depois: **Configurações → cole sua OpenAI API Key → Validar e salvar**.

> Gravação e áudio funcionam no Expo Go. Para gerar um app instalável: `npx expo prebuild` + `npx expo run:android|ios`, ou EAS Build.

## 🆓 Chave gratuita (Groq) — padrão
1. Acesse https://console.groq.com/keys e entre (Google/GitHub/e-mail, sem cartão).
2. **Create API Key** → copie a chave (`gsk_...`).
3. No app: **Configurações → Provedor: Groq → cole a chave → Validar e salvar**.
4. Crie um perfil e comece a trilha.

Groq = Llama 3.3 70B (chat) + Whisper (sua voz); voz do tutor = voz do aparelho/navegador (grátis). O plano gratuito tem limite de uso; se aparecer erro 429, espere um pouco. Para voz realista, troque para **OpenAI (pago)** em Configurações.

## Novidades
- **Layout responsivo**: no PC (≥900 px) a home e o chat usam duas colunas e o conteúdo é centralizado; no celular continua igual.
- **Uso e limites** (tela "Uso"): cota da chave lida dos cabeçalhos `x-ratelimit-*` (requisições/dia e tokens/min, com contagem regressiva do reset), contagem local por perfil e aviso quando bater o limite (429).
- **Área profissional** (Tecnologia ou Pedagogia) por perfil: adapta a Fase 3 e os exemplos do tutor.
- **Fase extra · Comunidade & Igreja Católica** (Missa, paróquia, Natal/Advento), liberada desde o início.
- **Fase 0 · Introdução & Pronúncia**: lições com áudio devagar/normal, "como ler" em sons do português, comparações e quiz. O tutor também mostra "como ler" nas respostas dos níveis iniciais.

## Perfis, trilha e níveis
- **Até 5 perfis** locais e independentes: nome, avatar, idioma foco, XP/nível/ofensiva, fases concluídas, vocabulário, histórico e chave OpenAI própria (ou a global, de Configurações).
- **XP**: ≥5 por mensagem (até 15, conforme `xp_awarded` do tutor: +5 sem erros, +até 5 por riqueza) e bônus ao concluir um cenário (50–150 XP; 15 se repetido).
- **Níveis** (`src/levels.ts`): 1–5 Iniciante A1–A2 (frases curtas, fala mais lenta), 6–15 Intermediário B1–B2 (expressões idiomáticas, rotina de TI), 16+ Avançado C1 (velocidade nativa, **modo escuta**: texto do tutor escondido até você pedir).
- **Trilha** (`src/curriculum.ts`): 4 fases / 13 cenários + Chat Livre. Cada cenário libera o próximo; há opção "Liberar todas as fases" por perfil.
- **Ofensiva** 🔥: dias seguidos praticando. **Vocabulário**: palavras novas do tutor salvas por perfil/idioma, com áudio e marcação de "aprendida".
- JSON do tutor: `reply_target_lang`, `translation_pt`, `correction_note`, `xp_awarded`, `pronunciation_tip`, `scenario_completed` (+ `vocab`, extensão para o caderno de palavras).

## Funcionalidades
- Idioma: Inglês 🇬🇧 / Polonês 🇵🇱
- Personagens: Sarah/Mateusz (amigável), Recrutador de TI, Imigração/Dia a dia
- Avatar animado com estados: ouvindo, pensando, falando
- Voz: segurar-para-falar ou tocar-para-gravar, **modo hands-free** (para sozinho ao detectar silêncio e reabre o microfone após o tutor falar)
- STT: Whisper (`whisper-1`) · TTS: OpenAI `tts-1` (vozes alloy/echo/nova…) ou voz nativa do aparelho (`expo-speech`); se o TTS da OpenAI falhar, cai automaticamente para a voz nativa
- Cada resposta: texto no idioma alvo, botão **Traduzir para Português**, card expansível **Dica de Gramática / Correção** e botão 🔊 para ouvir de novo
- Resposta do modelo em JSON (`reply_target_lang`, `translation_pt`, `correction_note`) com `response_format: json_object`
- Nível B1/B2 e modelo (gpt-4o-mini / gpt-4o) configuráveis

## Armazenamento local
- API key → `expo-secure-store` (Keychain/Keystore)
- Configurações e histórico (por idioma + personagem) → AsyncStorage

## Estrutura
```
app/            telas (Expo Router): index, chat, settings
src/personas.ts system prompts e personagens
src/openai.ts   chat, Whisper, TTS
src/audio.ts    gravação (com detecção de silêncio) e reprodução
src/store.ts    Zustand + persistência
```

## Notas
- A chamada à OpenAI é feita direto do aparelho com a chave do próprio usuário (app pessoal/local). Não distribua o app com uma chave embutida.
- Estilização com `StyleSheet` nativo (sem NativeWind) para evitar configuração extra de build.
