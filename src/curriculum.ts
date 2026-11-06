import { Field, Lang, Profile } from './types';

export const FREE_ID = 'free';

export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  /** Objetivos mostrados ao aluno (PT) — o tutor usa para decidir a conclusão */
  objectives: string[];
  /** Instrução de role-play (EN) para o modelo */
  brief: string;
  /** Particularidades da Polônia quando o idioma é polonês */
  plNote: string;
  xpReward: number;
  /** Versão do cenário para quem trabalha com Pedagogia (a padrão é TI) */
  pedagogy?: Partial<Pick<Scenario, 'title' | 'emoji' | 'desc' | 'objectives' | 'brief' | 'plNote'>>;
}

export interface Phase {
  id: number;
  title: string;
  emoji: string;
  subtitle: string;
  scenarios: Scenario[];
  /** Trilha opcional: não bloqueia a principal e começa liberada */
  optional?: boolean;
  /** Variações de título para Pedagogia */
  pedagogy?: { title: string; subtitle: string };
}

export const PHASES: Phase[] = [
  {
    id: 1,
    title: 'Fase 1 · Sobrevivência & Imigração Inicial',
    emoji: '🧭',
    subtitle: 'O básico para se virar logo que chegar',
    scenarios: [
      {
        id: 'p1-intro', title: 'Apresentação e cumprimentos', emoji: '👋', xpReward: 50,
        desc: 'Diga quem você é e conheça alguém novo.',
        objectives: ['Cumprimentar e se apresentar (nome, origem)', 'Dizer sua profissão', 'Perguntar nome/origem do outro', 'Se despedir educadamente'],
        brief: 'You are a friendly person the learner just met at a welcome event for newcomers. Greet them, let them introduce themselves, and chat about names, countries, jobs and how long they have been here.',
        plNote: 'Typical Polish greetings (Dzień dobry, Cześć, Miło mi), formal vs informal (pan/pani vs ty).',
      },
      {
        id: 'p1-directions', title: 'Rua e transporte público', emoji: '🚌', xpReward: 60,
        desc: 'Peça informações e compre bilhete.',
        objectives: ['Perguntar como chegar a um lugar', 'Entender direções (esquerda, direita, em frente)', 'Comprar bilhete / perguntar a linha e o ponto', 'Agradecer'],
        brief: 'You are a helpful local the learner stops on the street, and later a ticket-office clerk. The learner must ask for directions to a place (station, pharmacy, city centre) and buy a public transport ticket.',
        plNote: 'Poland: ZTM tickets, bilet jednorazowy/okresowy, przystanek, tramwaj, autobus, metro, "Przepraszam, jak dojść do...?".',
      },
      {
        id: 'p1-shopping', title: 'Mercado, restaurante e compras', emoji: '🛒', xpReward: 60,
        desc: 'Compre comida e peça no restaurante.',
        objectives: ['Pedir um prato/bebida no restaurante', 'Perguntar preço e pedir a conta', 'Fazer uma compra simples no mercado', 'Pagar (dinheiro/cartão)'],
        brief: 'You are a waiter at a casual restaurant and then a supermarket cashier. The learner orders food, asks about ingredients and prices, and pays.',
        plNote: 'Poland: pierogi, zupa, "Poproszę...", "Czy mogę płacić kartą?", paragon, reklamówka, Żabka/Biedronka.',
      },
      {
        id: 'p1-airport', title: 'Aeroporto e imigração', emoji: '✈️', xpReward: 70,
        desc: 'Check-in e controle de passaportes.',
        objectives: ['Fazer check-in e despachar bagagem', 'Responder ao motivo da viagem/estadia', 'Informar tempo de permanência e endereço', 'Entender instruções do agente'],
        brief: 'You are an airline check-in agent and then a border control officer. Ask for passport, luggage, purpose and length of stay, accommodation address, return ticket.',
        plNote: 'Poland/Schengen: kontrola graniczna, cel pobytu, wiza/pozwolenie na pobyt, Lotnisko Chopina, odprawa, bagaż rejestrowany.',
      },
    ],
  },
  {
    id: 2,
    title: 'Fase 2 · Instalação & Vida Prática',
    emoji: '🏠',
    subtitle: 'Moradia, saúde e burocracia',
    scenarios: [
      {
        id: 'p2-rent', title: 'Alugando um apartamento', emoji: '🔑', xpReward: 80,
        desc: 'Converse com proprietário/imobiliária.',
        objectives: ['Perguntar preço, tamanho e localização', 'Perguntar o que está incluso (contas, mobília)', 'Perguntar sobre caução e contrato', 'Combinar uma visita'],
        brief: 'You are a landlord / real-estate agent showing an apartment. Discuss rent, deposit, bills, furniture, rules, contract length and schedule a viewing.',
        plNote: 'Poland: czynsz, kaucja, opłaty (prąd, gaz, internet), umowa najmu, mieszkanie umeblowane, pośrednik/agencja.',
      },
      {
        id: 'p2-health', title: 'Médico, farmácia e emergências', emoji: '🩺', xpReward: 80,
        desc: 'Descreva sintomas e peça ajuda.',
        objectives: ['Descrever sintomas', 'Responder perguntas do médico/farmacêutico', 'Entender a receita/instruções', 'Pedir ajuda numa emergência'],
        brief: 'You are a clinic receptionist, then a doctor, then a pharmacist. The learner books an appointment, describes symptoms, understands the prescription. Include a short emergency phone-call moment.',
        plNote: 'Poland: NFZ, przychodnia, recepta, apteka, "Boli mnie...", numer alarmowy 112, pogotowie.',
      },
      {
        id: 'p2-admin', title: 'Prefeitura, PESEL e banco', emoji: '🏛️', xpReward: 90,
        desc: 'Resolva a burocracia do dia a dia.',
        objectives: ['Explicar o que precisa (registro/documento/conta)', 'Informar dados pessoais e endereço', 'Entender quais documentos faltam', 'Combinar próximos passos'],
        brief: 'You are a city-office clerk helping the learner register residence and get an ID number, and then a bank employee helping open a bank account. Ask for documents and personal details.',
        plNote: 'Poland: urząd miasta/gminy, meldunek, numer PESEL, Profil Zaufany, wniosek, konto w banku, dowód osobisty/paszport.',
      },
    ],
  },
  {
    id: 3,
    title: 'Fase 3 · Mercado de Trabalho & Suporte de TI',
    emoji: '💼',
    subtitle: 'Entrevistas, chamados e reuniões',
    pedagogy: { title: 'Fase 3 · Mercado de Trabalho & Educação', subtitle: 'Entrevistas, sala de aula, pais e reuniões pedagógicas' },
    scenarios: [
      {
        id: 'p3-hr', title: 'Entrevista inicial com RH', emoji: '🤝', xpReward: 100,
        pedagogy: {
          title: 'Entrevista inicial na escola / coordenação', emoji: '🏫',
          desc: 'Fale de você, formação e experiência com alunos.',
          objectives: ['Apresentar sua formação e experiência com crianças/jovens', 'Explicar sua filosofia de ensino', 'Responder uma pergunta comportamental (ex.: aluno difícil)', 'Falar de disponibilidade, horários e expectativa salarial'],
          brief: 'You are a school coordinator / HR representative running a first-round job interview for a teacher / pedagogue / teaching-assistant role (kindergarten, school or language school). Ask about education and qualifications, experience with children, teaching philosophy, motivation, strengths/weaknesses, a behavioural (STAR) question about a difficult classroom situation, schedule, salary expectations and work permit.',
          plNote: 'Poland: szkoła, przedszkole, dyrektor/koordynator, nauczyciel, pedagog, wykształcenie, staż pracy, umowa o pracę, wymiar godzin.',
        },
        desc: 'Fale de você, experiência e pretensão.',
        objectives: ['Fazer um pitch pessoal', 'Falar da experiência profissional', 'Responder uma pergunta comportamental', 'Falar de expectativa salarial e disponibilidade'],
        brief: 'You are an HR recruiter running a first-round job interview for an IT support / infrastructure role. Ask about background, motivation, strengths/weaknesses, behavioural (STAR) questions, salary expectations, notice period, relocation/visa.',
        plNote: 'Poland: umowa o pracę vs B2B, widełki płacowe, okres wypowiedzenia, brutto/netto, praca hybrydowa.',
      },
      {
        id: 'p3-tech', title: 'Entrevista técnica (Infra/Redes/N2-N3)', emoji: '🖥️', xpReward: 120,
        pedagogy: {
          title: 'Entrevista pedagógica (didática e sala de aula)', emoji: '📚',
          desc: 'Planejamento de aula, gestão de turma e avaliação.',
          objectives: ['Explicar como planeja uma aula', 'Descrever como lida com uma turma agitada ou alunos com necessidades diferentes', 'Explicar como avalia a aprendizagem', 'Dar um exemplo de atividade que você aplicaria'],
          brief: 'You are a head teacher running a pedagogical interview for a teaching role. Ask about lesson planning, classroom management, differentiation and inclusion (students with special educational needs), assessment and feedback, communication with parents, use of digital tools, and ask the learner to describe a sample activity.',
          plNote: 'Poland: plan lekcji, scenariusz zajęć, zarządzanie klasą, uczniowie ze specjalnymi potrzebami edukacyjnymi, ocena opisowa, dziennik elektroniczny, podstawa programowa.',
        },
        desc: 'Perguntas de infraestrutura, redes e suporte.',
        objectives: ['Explicar um conceito técnico (DNS/DHCP/VLAN/AD etc.)', 'Descrever como diagnosticaria um problema de rede', 'Descrever um incidente N2/N3 que resolveu', 'Fazer uma pergunta ao entrevistador'],
        brief: 'You are a senior infrastructure engineer running a technical interview for a Support L2/L3 / sysadmin role. Ask about networking (DNS, DHCP, VLAN, routing, VPN), Active Directory/Windows/Linux administration, monitoring, backups, troubleshooting methodology and a real incident story.',
        plNote: 'Use Polish IT vocabulary naturally (sieć, serwer, kopia zapasowa, awaria, zgłoszenie, eskalacja) while accepting common English terms.',
      },
      {
        id: 'p3-itsm', title: 'Chamados ITSM e usuários', emoji: '🎫', xpReward: 120,
        pedagogy: {
          title: 'Reunião com pais e atendimento a alunos', emoji: '👨‍👩‍👧',
          desc: 'Converse com pais sobre desempenho e comportamento.',
          objectives: ['Ouvir e acolher a preocupação dos pais', 'Explicar a situação do aluno de forma clara e gentil', 'Propor um plano de ação com prazos', 'Fechar a conversa combinando o acompanhamento'],
          brief: 'You are a worried parent (or a student) meeting the learner, who plays the teacher. You are concerned about your child\'s grades or behaviour. The learner must listen, empathise, explain, propose a plan and agree on follow-up.',
          plNote: 'Poland: wywiadówka, rozmowa z rodzicem, oceny, zachowanie, plan wsparcia, pedagog szkolny, dziennik.',
        },
        desc: 'Atenda tickets e fale com equipes internacionais.',
        objectives: ['Coletar informações do usuário (sintoma, impacto, urgência)', 'Explicar o diagnóstico/solução de forma clara', 'Definir prioridade/SLA ou escalar o chamado', 'Fechar o ticket confirmando com o usuário'],
        brief: 'You are a non-technical employee (or a colleague on an international team) who calls the IT service desk with a problem (VPN down, locked account, slow laptop, printer, shared drive). The learner plays the support analyst handling the ITSM ticket: triage, questions, priority, workaround, escalation, closing.',
        plNote: 'Polish: zgłoszenie/ticket, priorytet, SLA, eskalacja do drugiej linii, rozwiązanie tymczasowe, reset hasła.',
      },
      {
        id: 'p3-daily', title: 'Daily Scrum e prioridades de TI', emoji: '📅', xpReward: 130,
        pedagogy: {
          title: 'Reunião pedagógica: planejamento e prioridades', emoji: '🗓️',
          desc: 'Atualize a equipe e negocie prioridades escolares.',
          objectives: ['Dar o status das turmas/projetos', 'Reportar um impedimento (material, horário, sala)', 'Negociar a prioridade entre dois compromissos', 'Concordar em próximos passos e prazos'],
          brief: 'You are the pedagogical coordinator in a weekly team meeting of teachers. Ask for status, obstacles, then raise two conflicting priorities (e.g. a school event vs. exam preparation) so the learner must negotiate priorities and deadlines.',
          plNote: 'Poland: rada pedagogiczna, zebranie zespołu, plan pracy, sprawdzian, uroczystość szkolna, termin, priorytet.',
        },
        desc: 'Atualize o time e negocie prioridades.',
        objectives: ['Dar o status (ontem/hoje/bloqueios)', 'Reportar um impedimento', 'Negociar a prioridade de duas demandas', 'Concordar em próximos passos e prazos'],
        brief: 'You are the team lead (or product owner) in a daily stand-up with an international IT team. Ask for status, blockers, and then push back with a conflicting urgent request so the learner must negotiate priorities and deadlines.',
        plNote: 'Polish: daily, sprint, blokada, termin, priorytet, "Mam konflikt priorytetów", zespół.',
      },
    ],
  },
  {
    id: 4,
    title: 'Fase 4 · Socialização & Fluência Livre',
    emoji: '☕',
    subtitle: 'Conversa natural, sem roteiro',
    scenarios: [
      {
        id: 'p4-smalltalk', title: 'Small talk no café do trabalho', emoji: '☕', xpReward: 140,
        desc: 'Bate-papo informal com colegas.',
        objectives: ['Iniciar um small talk (clima, fim de semana)', 'Falar de planos e do dia', 'Fazer perguntas de volta e reagir', 'Encerrar a conversa naturalmente'],
        brief: 'You are a friendly colleague meeting the learner at the office coffee machine. Make casual small talk: weekend, weather, lunch, projects, commute, plans. Use natural idioms.',
        plNote: 'Polish office small talk: weekend, pogoda, obiad, "co słychać?", "jak minął weekend?".',
      },
      {
        id: 'p4-debate', title: 'Debates: hobbies, cultura e viagens', emoji: '🗺️', xpReward: 150,
        desc: 'Defenda opiniões sobre temas gerais.',
        objectives: ['Dar e justificar uma opinião', 'Discordar educadamente', 'Falar de cultura (Polônia/Brasil)', 'Contar uma experiência de viagem'],
        brief: 'You are an open-minded conversation partner who enjoys friendly debates about hobbies, culture (Poland, Brazil), food, travel and daily life. Challenge opinions gently and ask "why?".',
        plNote: 'Polish culture topics: tradycje, Wigilia, pierogi, góry, Mazury, Kraków, różnice kulturowe.',
      },
    ],
  },
  {
    id: 5,
    title: 'Fase Extra · Comunidade & Igreja Católica',
    emoji: '⛪',
    subtitle: 'Missa, paróquia, Natal e festas — liberada desde o início',
    optional: true,
    scenarios: [
      {
        id: 'p5-mass', title: 'Indo à Missa', emoji: '⛪', xpReward: 80,
        desc: 'Horários, cumprimentos e participação.',
        objectives: ['Perguntar o horário da Missa e se há Missa em português/inglês', 'Cumprimentar com educação ao chegar', 'Entender avisos simples e as respostas da liturgia', 'Se despedir com uma saudação cristã'],
        brief: 'You are a friendly parishioner (and later the sacristan) welcoming a Catholic newcomer to the parish. Talk about Mass times, which Mass to attend, where to sit, the main responses and greetings of the liturgy, the offertory/collection, Communion and parish announcements. Be warm and respectful.',
        plNote: 'Poland: msza święta, parafia, kościół, ksiądz proboszcz, ministrant, kolekta, ogłoszenia parafialne, "Szczęść Boże!", "Pan z wami" – "I z duchem twoim", "Niech będzie pochwalony Jezus Chrystus".',
      },
      {
        id: 'p5-parish', title: 'Paróquia, sacramentos e voluntariado', emoji: '🕊️', xpReward: 90,
        desc: 'Secretaria paroquial, confissão e grupos.',
        objectives: ['Perguntar sobre confissão e horários de atendimento', 'Informar-se sobre sacramentos (batismo, casamento, crisma)', 'Perguntar sobre grupos da paróquia ou voluntariado', 'Combinar um próximo contato'],
        brief: 'You are a parish office secretary / volunteer helping a Catholic newcomer: office hours, confession times, preparing sacraments (baptism, marriage preparation, confirmation), parish groups, choir, Caritas volunteering and how to register as a parishioner.',
        plNote: 'Poland: kancelaria parafialna, spowiedź, sakramenty, chrzest, bierzmowanie, nauki przedmałżeńskie, Caritas, schola, wspólnota, wizyta duszpasterska (kolęda).',
      },
      {
        id: 'p5-christmas', title: 'Natal, Advento e festas católicas', emoji: '🎄', xpReward: 100,
        desc: 'Tradições de Natal, Páscoa e família.',
        objectives: ['Falar de como você celebra o Natal', 'Perguntar sobre as tradições locais (Advento, ceia, Missa do Galo)', 'Desejar boas festas e abençoar', 'Comparar uma tradição do Brasil com a local'],
        brief: 'You are a warm Catholic friend chatting about Advent, Christmas Eve dinner, Midnight Mass, Christmas traditions, Easter, family customs, and comparing them with Brazilian traditions. Include festive greetings and blessings.',
        plNote: 'Poland: Adwent, roraty, Wigilia, opłatek (dzielenie się opłatkiem), 12 potraw, wolne miejsce przy stole, Pasterka, Boże Narodzenie, Wielkanoc, święconka. Wishes: "Wesołych Świąt!", "Błogosławionych Świąt".',
      },
    ],
  },
];

export const FREE_SCENARIO: Scenario = {
  id: FREE_ID, title: 'Chat livre', emoji: '💬', xpReward: 0,
  desc: 'Prática aberta com o tutor que você escolher.',
  objectives: [], brief: '', plNote: '',
};

export const MAIN_PHASES = PHASES.filter((p) => !p.optional);
export const EXTRA_PHASES = PHASES.filter((p) => p.optional);
const TRAIL: Scenario[] = MAIN_PHASES.flatMap((p) => p.scenarios);
const EXTRA: Scenario[] = EXTRA_PHASES.flatMap((p) => p.scenarios);

export const scenarioKey = (lang: Lang, id: string) => `${lang}:${id}`;
export const isDone = (p: Profile, id: string) => (p.completed[scenarioKey(p.lang, id)] ?? 0) > 0;

/** Aplica a variante da área profissional (Tecnologia é o padrão). */
export function scenarioFor(sc: Scenario, field: Field | undefined): Scenario {
  return field === 'pedagogy' && sc.pedagogy ? { ...sc, ...sc.pedagogy } : sc;
}

export function phaseFor(ph: Phase, field: Field | undefined): Phase {
  const f = field === 'pedagogy';
  return {
    ...ph,
    title: f && ph.pedagogy ? ph.pedagogy.title : ph.title,
    subtitle: f && ph.pedagogy ? ph.pedagogy.subtitle : ph.subtitle,
    scenarios: ph.scenarios.map((sc) => scenarioFor(sc, field)),
  };
}

export function getScenario(id: string, field?: Field): Scenario | undefined {
  if (id === FREE_ID) return FREE_SCENARIO;
  const sc = [...TRAIL, ...EXTRA].find((x) => x.id === id);
  return sc ? scenarioFor(sc, field) : undefined;
}

export function isUnlocked(p: Profile, id: string): boolean {
  if (p.unlockAll) return true;
  const e = EXTRA.findIndex((s) => s.id === id);
  if (e >= 0) return e === 0 || isDone(p, EXTRA[e - 1].id); // trilha extra: começa liberada
  // Chat livre abre junto com a Fase 4
  const target = id === FREE_ID ? MAIN_PHASES[3].scenarios[0].id : id;
  const i = TRAIL.findIndex((s) => s.id === target);
  if (i <= 0) return i === 0;
  return isDone(p, TRAIL[i - 1].id);
}

export function phaseProgress(p: Profile, phase: Phase) {
  const done = phase.scenarios.filter((s) => isDone(p, s.id)).length;
  return { done, total: phase.scenarios.length };
}

/** Próximo cenário da trilha principal */
export const nextScenario = (p: Profile) => TRAIL.find((s) => !isDone(p, s.id));
