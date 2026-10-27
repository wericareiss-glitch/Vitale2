import { Procedure } from '../types';

export const PROCEDURES: Procedure[] = [
  {
    id: "consulta-avaliacao",
    name: "Consulta e Avaliação Individualizada",
    category: "facial",
    price: 100,
    duration: "45 min",
    sessions: "1 sessão",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80",
    description: "Anamnese estética minuciosa realizada no seu domicílio em Teresina, avaliação de biotipo dérmico, prescrição home care magistral e elaboração de protocolo individualizado.",
    benefits: [
      "Anamnese clínica no domicílio",
      "Prescrição cosmecêutica individual",
      "Mapeamento dérmico preciso",
      "Cortesia de R$ 100 ao combinar com outro procedimento"
    ]
  },
  {
    id: "vitaminas-injetaveis",
    name: "Vitaminas Injetáveis sob Demanda",
    category: "injetaveis",
    price: 580,
    duration: "40 min",
    sessions: "Shot Injetável IM/SC",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=700&q=80",
    description: "Suplementação injetável estéril personalizada (Complexo B, Vitamina C tamponada, Biotina, Coenzima Q10 e antioxidantes) manipulada sob demanda para absorção de 100% sem perda gastrointestinal.",
    benefits: [
      "Absorção biológica imediata",
      "Aumento de disposição e energia celular",
      "Fortalecimento dérmico, unhas e cabelos",
      "Manipulado estéril para a sua sessão"
    ]
  },
  {
    id: "enzimas-lipoliticas",
    name: "Aplicação de Enzimas Lipolíticas (Gordura Localizada)",
    category: "injetaveis",
    price: 700,
    duration: "50 min",
    sessions: "Sessão com mescla lipolítica",
    image: "https://images.unsplash.com/photo-1512290900672-1f02e646271a?auto=format&fit=crop&w=700&q=80",
    description: "Infiltração de mesclas lipolíticas consagradas para quebra localizada de adipócitos resistentes (abdômen, flancos, culote ou papada) com total discrição e conforto em casa.",
    benefits: [
      "Ação lipolítica concentrada",
      "Sem pós-operatório invasivo",
      "Redução visível de medidas",
      "Aplicação com agulhas finíssimas estéreis"
    ]
  },
  {
    id: "microagulhamento-drug",
    name: "Microagulhamento com Drug Delivery & Fatores de Crescimento",
    category: "facial",
    price: 840,
    duration: "60 min",
    sessions: "1 sessão",
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=700&q=80",
    description: "Indução percutânea de colágeno associada à infusão de fatores de crescimento estéreis, peptídeos bioidênticos e ácido hialurônico para regeneração profunda.",
    benefits: [
      "Estímulo maciço de colágeno novo",
      "Fechamento de poros e melhora de cicatrizes",
      "Atenuação de linhas e melasma",
      "Kit de agulhas e ponteiras 100% descartável"
    ]
  },
  {
    id: "peeling-quimico",
    name: "Peeling Químico Magistral & Renovador Cutâneo",
    category: "facial",
    price: 560,
    duration: "45 min",
    sessions: "1 sessão",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80",
    description: "Aplicação de blend de ácidos magistrais biocompatíveis para esfoliação química controlada, estímulo à renovação celular e clareamento de manchas adaptado ao clima de Teresina.",
    benefits: [
      "Renovação da camada córnea",
      "Uniformização de tom e viço acetinado",
      "Controle de oleosidade e comedões",
      "Fórmulas dermatológicas de grau médico"
    ]
  },
  {
    id: "limpeza-pele-profunda",
    name: "Limpeza de Pele Profunda com Fototerapia LED & Alta Frequência",
    category: "facial",
    price: 440,
    duration: "75 min",
    sessions: "1 sessão",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=700&q=80",
    description: "Higienização profunda dos poros, emoliência biológica sem dor, extração cuidadosa de comedões, cauterização com alta frequência e banho de LED regenerativo.",
    benefits: [
      "Desobstrução completa de poros",
      "Ação bactericida e calmante",
      "Luminosidade instantânea",
      "Finalização com sérum antioxidante"
    ]
  },
  {
    id: "drenagem-linfatica",
    name: "Drenagem Linfática Corporal Especializada",
    category: "corporal",
    price: 380,
    duration: "60 min",
    sessions: "1 sessão",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80",
    description: "Manobras corporais precisas e rítmicas com óleos essenciais para drenar toxinas, desinchar o corpo, ativar a circulação e modelar suavemente.",
    benefits: [
      "Redução imediata de retenção hídrica",
      "Alívio de peso corporal e cansaço",
      "Estímulo ao sistema imunológico",
      "Maca ergonômica montada no seu espaço"
    ]
  },
  {
    id: "hydra-gloss-lips",
    name: "Hydra Gloss Lips / Revitalização e Nutrição Labial",
    category: "facial",
    price: 440,
    duration: "45 min",
    sessions: "1 sessão",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=700&q=80",
    description: "Microinfusão labial de ácido hialurônico de baixo peso molecular, pantenol e vitaminas nutritivas, devolvendo volume hídrico, viço e cor rosada natural.",
    benefits: [
      "Lábios ultra-hidratados e nutridos",
      "Efeito gloss com brilho saudável",
      "Eliminação de ressecamento térmico",
      "Sem preenchimento volumizador ou dor"
    ]
  }
];

export const CLINIC_CONFIG = {
  phone: "5586999998888",
  displayPhone: "(86) 99999-8888",
  city: "Teresina",
  state: "PI",
  name: "Vitale Concierge Estética Avançada",
};
