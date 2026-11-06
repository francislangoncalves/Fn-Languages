import { Lang } from './types';

export interface Row {
  t: string; // texto no idioma alvo (toca ao clicar)
  say: string; // "como ler" com sons do português (aproximação)
  pt: string; // significado / exemplo
  note?: string;
}

export interface Lesson {
  id: string;
  lang: Lang;
  title: string;
  emoji: string;
  intro: string;
  rows: Row[];
  tips: string[];
  xp: number;
  /** Lições de sons: sem quiz, conclui após ouvir */
  noQuiz?: boolean;
}

/** A leitura entre aspas é uma APROXIMAÇÃO com sons do português; acento agudo marca a sílaba forte. */
export const LESSONS: Lesson[] = [
  /* ───────────────────────── POLONÊS ───────────────────────── */
  {
    id: 'pl-sounds', lang: 'pl', emoji: '🔤', xp: 30, noQuiz: true,
    title: 'Os sons do polonês (vs. português)',
    intro:
      'Boa notícia: o polonês usa o nosso alfabeto, então dá para ler! Só existem uns poucos sons novos — e quase todos têm um parecido em português. Regra de ouro: a sílaba forte é quase sempre a PENÚLTIMA (Pól-ska, ko-bié-ta). Toque em cada linha para ouvir.',
    rows: [
      { t: 'ł', say: 'som de "u" (como em "mau", "céu")', pt: 'ładnie → "uádnhe" = bonito' },
      { t: 'w', say: 'igual ao "v" português', pt: 'wino → "víno" = vinho' },
      { t: 'sz', say: 'igual ao "ch" de "chá"', pt: 'szkoła → "chkôua" = escola' },
      { t: 'cz', say: 'igual ao "tch" de "tchau"', pt: 'czas → "tchas" = tempo' },
      { t: 'ż / rz', say: 'igual ao "j" de "jantar"', pt: 'żona → "jôna" = esposa · rzeka → "jéka" = rio' },
      { t: 'ś / si', say: '"ch" suave, com a língua mais perto do céu da boca', pt: 'siostra → "chôstra" = irmã' },
      { t: 'ć / ci', say: '"tch" suave', pt: 'ciasto → "tchiásto" = bolo' },
      { t: 'ź / zi', say: '"j" suave', pt: 'zima → "jíma" = inverno' },
      { t: 'dź / dzi', say: '"dj" suave (como "dia" no sotaque carioca)', pt: 'dziecko → "djétsko" = criança' },
      { t: 'ń / ni', say: 'igual ao "nh" de "ninho"', pt: 'koń → "kônh" = cavalo' },
      { t: 'ą', say: 'vogal nasal, como "om/on" em "som"', pt: 'są → "sôm" = (eles) são' },
      { t: 'ę', say: 'vogal nasal, como "em/en" em "sem"', pt: 'mięso → "miênso" = carne' },
      { t: 'ó', say: 'igual ao "u"', pt: 'góra → "gúra" = montanha' },
      { t: 'ch / h', say: '"r" forte do início de "rato", com mais ar (como "h" soprado)', pt: 'chleb → "hlép" = pão' },
      { t: 'c', say: 'igual ao "ts"', pt: 'co → "tso" = o quê' },
      { t: 'j', say: 'igual ao "i" (como "iate")', pt: 'jak → "iak" = como' },
      { t: 'y', say: 'um "i" mais fechado, com a língua recuada (não existe em português)', pt: 'ty → "ti" (recuado) = você' },
      { t: 'r', say: 'rolado, igual ao "r" de "caro"', pt: 'rok → "rok" = ano' },
    ],
    tips: [
      'Letra final sonora vira surda: "chleb" soa "hlep", "rzeka" é "jéka".',
      'Muitas consoantes seguidas assustam, mas são só os sons acima: szczęście (felicidade) = "chtchêntchie".',
      'Cada letra tem SEMPRE o mesmo som. Aprendeu o som, aprendeu a leitura.',
    ],
  },
  {
    id: 'pl-greetings', lang: 'pl', emoji: '👋', xp: 30,
    title: 'Cumprimentos: "Bom dia" em polonês',
    intro:
      'Exemplo clássico: "Bom dia" é Dzień dobry — lê-se "djênh dóbri". Dzień = dia (dź = "dj" suave) e dobry = bom. Repare: em polonês, "bom dia" e "boa tarde" são a MESMA frase!',
    rows: [
      { t: 'Dzień dobry', say: 'djênh dóbri', pt: 'Bom dia / Boa tarde', note: 'formal; vale até o fim da tarde' },
      { t: 'Dobry wieczór', say: 'dóbri viétchur', pt: 'Boa noite (ao chegar)' },
      { t: 'Dobranoc', say: 'dobranóts', pt: 'Boa noite (ao se despedir/dormir)' },
      { t: 'Cześć', say: 'tchéchtch', pt: 'Oi / Tchau', note: 'informal, entre amigos' },
      { t: 'Do widzenia', say: 'do vidzênia', pt: 'Até logo (formal)' },
      { t: 'Dziękuję', say: 'djenkúie', pt: 'Obrigado(a)' },
      { t: 'Proszę', say: 'próche', pt: 'Por favor / De nada / Aqui está' },
      { t: 'Przepraszam', say: 'psheprásham', pt: 'Desculpe / Com licença' },
      { t: 'Tak / Nie', say: 'tak / nhe', pt: 'Sim / Não' },
      { t: 'Jak się masz?', say: 'iak shie mash', pt: 'Como vai? (informal)' },
      { t: 'Dobrze, dziękuję', say: 'dóbje, djenkúie', pt: 'Bem, obrigado' },
      { t: 'Nazywam się…', say: 'nazívam shie', pt: 'Eu me chamo…' },
      { t: 'Miło mi', say: 'míwo mi', pt: 'Prazer' },
      { t: 'Nie rozumiem', say: 'nhe rozúmiem', pt: 'Não entendo' },
      { t: 'Proszę powtórzyć', say: 'próche povtújitch', pt: 'Pode repetir, por favor?' },
      { t: 'Mówię trochę po polsku', say: 'múvie tróhe po pólsku', pt: 'Falo um pouco de polonês' },
    ],
    tips: [
      'Pan = senhor, Pani = senhora: use em lojas, repartições e com desconhecidos ("Dzień dobry, Pani").',
      'Cześć é para amigos; com desconhecidos prefira Dzień dobry.',
      'Se não entendeu, "Nie rozumiem" + "Proszę powtórzyć" salvam qualquer conversa.',
    ],
  },
  {
    id: 'pl-numbers', lang: 'pl', emoji: '🔢', xp: 30,
    title: 'Números e palavras que você já conhece',
    intro:
      'O polonês tem muitas palavras internacionais — você já entende várias! E os números de 1 a 10 abrem portas: preços, horários, ônibus e telefone.',
    rows: [
      { t: 'jeden', say: 'iéden', pt: '1' },
      { t: 'dwa', say: 'dva', pt: '2' },
      { t: 'trzy', say: 'tchi (com "tch" chiado)', pt: '3' },
      { t: 'cztery', say: 'tchtéri', pt: '4' },
      { t: 'pięć', say: 'piêntch', pt: '5' },
      { t: 'sześć', say: 'chéchtch', pt: '6' },
      { t: 'siedem', say: 'chiédem', pt: '7' },
      { t: 'osiem', say: 'óchiem', pt: '8' },
      { t: 'dziewięć', say: 'djiévienhtch', pt: '9' },
      { t: 'dziesięć', say: 'djiéchientch', pt: '10' },
      { t: 'restauracja', say: 'restaurátsia', pt: 'restaurante' },
      { t: 'telefon', say: 'teléfon', pt: 'telefone' },
      { t: 'komputer', say: 'kompúter', pt: 'computador' },
      { t: 'muzyka', say: 'múzika', pt: 'música' },
      { t: 'problem', say: 'próblem', pt: 'problema' },
      { t: 'kawa', say: 'káva', pt: 'café ☕ (não é parecida!)' },
    ],
    tips: [
      'Palavras terminadas em -cja/-cia costumam ser nossas "-ção": informacja = informação.',
      'Aprenda os números ouvindo preços no supermercado: "dwa złote pięćdziesiąt".',
    ],
  },
  {
    id: 'pl-how', lang: 'pl', emoji: '🧩', xp: 30,
    title: 'Por que parece difícil (e como vencer)',
    intro:
      'O polonês é, sim, mais difícil que o inglês — mas por motivos específicos. Saber quais são tira o medo. O segredo: aprender FRASES PRONTAS, não tabelas.',
    rows: [
      { t: 'Jestem Francis', say: 'iéstem Francis', pt: 'Eu sou Francis' },
      { t: 'Jestem zmęczony / zmęczona', say: 'iéstem zmenntchôni / zmenntchôna', pt: 'Estou cansado / cansada', note: 'o fim da palavra muda com o gênero' },
      { t: 'Mam…', say: 'mam', pt: 'Eu tenho…' },
      { t: 'Chcę…', say: 'htsê', pt: 'Eu quero…' },
      { t: 'kawa → Poproszę kawę', say: 'popróche káve', pt: 'Queria um café, por favor', note: 'kawa vira kawę: é um "caso" (função na frase)' },
    ],
    tips: [
      '7 casos: o final da palavra muda conforme a função (kawa → kawę). Não decore tabelas: aprenda a frase inteira ("Poproszę kawę").',
      'Não existem artigos (o, a, um): "kawa" é café, o café ou um café.',
      'Verbos mudam por pessoa (como no português — vantagem nossa!).',
      'A ordem das palavras é bem livre, e o tutor vai repetir as frases corretas para você ouvir o padrão.',
      'Nos primeiros níveis o tutor mostra "como ler" em português abaixo de cada resposta.',
    ],
  },

  /* ───────────────────────── INGLÊS ───────────────────────── */
  {
    id: 'en-sounds', lang: 'en', emoji: '🔤', xp: 30, noQuiz: true,
    title: 'Sons difíceis para brasileiros',
    intro:
      'No inglês, a escrita engana: a mesma letra tem vários sons. Estes são os pontos em que brasileiros mais tropeçam. Toque para ouvir.',
    rows: [
      { t: 'th (think)', say: 'língua entre os dentes, só soprando (não vire "f" nem "t")', pt: 'think, thanks, three' },
      { t: 'th (this)', say: 'igual, mas com a garganta vibrando', pt: 'this, that, mother' },
      { t: 'work-ed', say: '-ed soa "t" ou "d": worked = "uôrkt", played = "pleid"', pt: 'só soa "id" depois de t/d: wanted = "uântid"' },
      { t: 'h (house)', say: 'só um sopro; NÃO é "r"!', pt: 'house ≠ "rauss"; hotel = "hôutel"' },
      { t: 'ship / sheep', say: 'i curto ("ship") vs. i longo ("shiip")', pt: 'ship = navio · sheep = ovelha' },
      { t: 'w (water)', say: 'como um "u" rápido', pt: 'water → "uóter"' },
      { t: 'r (red)', say: 'língua enrolada para trás, sem tocar no céu da boca', pt: 'red, right, car' },
      { t: 'Facebook', say: 'consoante final sem "i": "feissbuk", não "feissibuki"', pt: 'não acrescente vogal no fim' },
      { t: 'about', say: 'vogal fraca vira "â": "abáut"; banana = "banéna"', pt: 'sílabas fracas são "engolidas"' },
    ],
    tips: [
      'A sílaba forte é mais longa e alta; as outras ficam curtas: PHOtograph × phoTOGraphy.',
      'Ouça muito: o tutor fala devagar no início e acelera com seu nível.',
    ],
  },
  {
    id: 'en-greetings', lang: 'en', emoji: '👋', xp: 30,
    title: 'Cumprimentos: "Good morning" e cia.',
    intro: '"Bom dia" é Good morning — "gud mórnin". Diferente do polonês, o inglês separa manhã, tarde e noite.',
    rows: [
      { t: 'Good morning', say: 'gud mórnin', pt: 'Bom dia' },
      { t: 'Good afternoon', say: 'gud afternún', pt: 'Boa tarde' },
      { t: 'Good evening', say: 'gud ívnin', pt: 'Boa noite (ao chegar)' },
      { t: 'Hi / Hello', say: 'hai / helôu (h = só um sopro)', pt: 'Oi / Olá', note: 'o h é só um sopro' },
      { t: 'How are you?', say: 'rau ár iú', pt: 'Como vai você?' },
      { t: "I'm fine, thanks", say: 'aim fain, thénks', pt: 'Estou bem, obrigado' },
      { t: 'Nice to meet you', say: 'náis tu mít iu', pt: 'Prazer em conhecer' },
      { t: 'My name is…', say: 'mai neim iz', pt: 'Meu nome é…' },
      { t: 'Where are you from?', say: 'uér ár iu frâm', pt: 'De onde você é?' },
      { t: "I'm from Brazil", say: 'aim frâm brazíl', pt: 'Sou do Brasil' },
      { t: 'Thank you', say: 'thénk iu', pt: 'Obrigado' },
      { t: 'Please', say: 'plíiz', pt: 'Por favor' },
      { t: 'Sorry / Excuse me', say: 'sóri / iks-kiúz mi', pt: 'Desculpe / Com licença' },
      { t: "I don't understand", say: 'ai dôunt anderstând', pt: 'Não entendo' },
      { t: 'Could you repeat that?', say: 'cud iu ripít dét', pt: 'Pode repetir?' },
    ],
    tips: ['"Could you…?" é mais educado que "Can you…?".', 'Com desconhecidos, sorria e diga "Excuse me" antes de perguntar.'],
  },
  {
    id: 'en-friends', lang: 'en', emoji: '🪞', xp: 30,
    title: 'Palavras parecidas e falsos amigos',
    intro: 'Cerca de metade das palavras difíceis do inglês têm "parente" em português. Mas cuidado com os falsos amigos!',
    rows: [
      { t: 'information', say: 'infermêishan', pt: '-tion = -ção: informação, nation = nação' },
      { t: 'university', say: 'iunivérsiti', pt: '-ity = -dade: universidade, city' },
      { t: 'really', say: 'ríli', pt: '-ly = -mente: realmente' },
      { t: 'actually', say: 'ékchuali', pt: '⚠ = na verdade (NÃO "atualmente")' },
      { t: 'pretend', say: 'pritênd', pt: '⚠ = fingir (NÃO "pretender")' },
      { t: 'library', say: 'láibreri', pt: '⚠ = biblioteca (NÃO "livraria")' },
      { t: 'push', say: 'push', pt: '⚠ = empurrar (NÃO "puxar" — puxar é pull)' },
      { t: 'parents', say: 'pérents', pt: '⚠ = pais (NÃO "parentes" — parentes é relatives)' },
      { t: 'resume / CV', say: 'rézumei / si-ví', pt: 'currículo' },
    ],
    tips: ['Ao ver uma palavra parecida, aposte no significado — e confirme pelo contexto.'],
  },
  {
    id: 'en-how', lang: 'en', emoji: '🧩', xp: 30,
    title: 'Como o inglês funciona (é mais simples!)',
    intro: 'O inglês é mais fácil de montar que o polonês: sem gênero, sem casos, quase sem conjugação.',
    rows: [
      { t: 'I am a teacher / an engineer', say: 'ai ém a tícher / an enginír', pt: 'Eu sou professor / engenheiro' },
      { t: 'I have a question', say: 'ai rév a kuéschan', pt: 'Eu tenho uma pergunta' },
      { t: 'I want some coffee', say: 'ai uânt sâm kófi', pt: 'Eu quero café' },
      { t: 'Could I have a coffee, please?', say: 'cud ai rév a kófi plíiz', pt: 'Posso tomar um café, por favor?' },
      { t: 'Do you speak Portuguese?', say: 'du iu spík portiguíz', pt: 'Você fala português?' },
    ],
    tips: [
      'O sujeito é obrigatório: "I", "you", "he"… (não dá para dizer só "tenho").',
      'O verbo só muda na 3ª pessoa: I work, she works.',
      'Perguntas usam do/does: "Do you work here?"',
      'Contrações são normais na fala: I am → I\'m, do not → don\'t.',
    ],
  },
];

export const lessonsFor = (lang: Lang) => LESSONS.filter((l) => l.lang === lang);
export const getLesson = (id: string) => LESSONS.find((l) => l.id === id);
