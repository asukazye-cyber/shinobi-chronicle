export type VisualSlotKind = 'background' | 'scene';
export type VisualSlot = { id: string; kind: VisualSlotKind; file: string; label: string; purpose: string; integrated: boolean };

const background = (id: string, label: string, purpose: string, integrated = false): VisualSlot => ({ id: `background:${id}`, kind: 'background', file: `backgrounds/${id}.webp`, label, purpose, integrated });
const scene = (id: string, label: string, purpose: string): VisualSlot => ({ id: `scene:${id}`, kind: 'scene', file: `scenes/${id}.webp`, label, purpose, integrated: false });

/** A file in public/assets/<file> owns this slot. Missing art keeps a readable fallback. */
export const visualSlots: VisualSlot[] = [
  background('hoshigakure-square', 'Hoshigakure', 'Cabeçalho e retorno à vila.'),
  background('kazan-forge', 'Kazan', 'Cabeçalho e retorno à vila.'),
  background('mizuhara-canals', 'Mizuhara', 'Cabeçalho e retorno à vila.'),
  background('sunae-dunes', 'Sunae', 'Cabeçalho e retorno à vila.'),
  background('kurogane-bridges', 'Kurogane', 'Cabeçalho e retorno à vila.'),
  background('training-ground', 'Campo de treino', 'Treino e prática entre operações.'),
  background('vale-das-pontes', 'Vale das Pontes', 'Circuito regional e exame Chuunin.'),
  background('cupula-das-cinco-rotas', 'Cúpula das Cinco Rotas', 'Final internacional Jounin.'),
  background('borderlands', 'Fronteiras', 'Missões e crises de fronteira.'),
  background('council-chamber', 'Câmara do Conselho', 'Nomeações, mandados e decisões políticas.'),
  background('faction-district', 'Distrito de facção', 'Encontros neutros das facções.'),
  background('hall-of-legends', 'Hall of Legends', 'Encerramento de carreira e legado.'),
  scene('academy-opening', 'O sino caído', 'Prólogo da Academia.'),
  scene('graduation', 'Graduação', 'Prova e transição para Genin.'),
  scene('regional-crisis', 'Crise regional', 'Circuito intervilas Genin.'),
  scene('tournament-final', 'Fase final', 'Torneios Chuunin e Jounin.'),
  scene('rival-confrontation', 'Rivalidade', 'Encontros decisivos com o rival persistente.'),
  scene('mission-rescue', 'Resgate', 'Missões de extração e proteção.'),
  scene('mission-siege', 'Cerco', 'Ataques à vila, crises e defesa de posições.'),
  scene('power-awakening', 'Despertar', 'Bijū, Sage, Portões, invocação ou dōjutsu.'),
  scene('faction-reckoning', 'Acerto de contas', 'Operações contra ou junto das facções.'),
  scene('legacy', 'Legado', 'Biografia final da vida shinobi.')
];

const slotsById = new Map(visualSlots.map(slot => [slot.id, slot]));
const villageSlots: Record<string, string> = {
  Hoshigakure: 'background:hoshigakure-square', Kazan: 'background:kazan-forge', Mizuhara: 'background:mizuhara-canals', Sunae: 'background:sunae-dunes', Kurogane: 'background:kurogane-bridges'
};

export const publicAssetUrl = (file: string) => `/assets/${file}`;
export const getVisualSlot = (id: string) => slotsById.get(id);
export const villageBackgroundSlot = (village: string) => getVisualSlot(villageSlots[village] ?? 'background:hoshigakure-square')!;
