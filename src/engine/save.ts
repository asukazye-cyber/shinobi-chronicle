import type { GameState } from '../domain/types';
export function encodeSave(state: GameState): string { return JSON.stringify(state); }
export function decodeSave(json: string): GameState { const state = JSON.parse(json) as GameState; if (state.saveVersion !== 1 || !state.character || !Array.isArray(state.chronicle)) throw new Error('Unsupported or invalid save.'); const legacy = state.character.attributes as unknown as Record<string, number>; if (legacy.ninjutsu === undefined) { const body = legacy.body ?? 3, mind = legacy.mind ?? 3, chakra = legacy.chakra ?? 3, resolve = legacy.resolve ?? 3; state.character.attributes = { ninjutsu: chakra, taijutsu: body, genjutsu: mind, intelligence: mind, strength: body, speed: body, stamina: chakra, handSeals: chakra, chakraControl: chakra, willpower: resolve }; state.character.chakraPool = Math.min(chakra * 12, state.character.chakraPool); } state.world.storyFlags ??= []; state.world.factions ??= [{ id: 'eclipse-covenant', name: 'Pacto do Eclipse', agenda: 'reunir poderes raros antes que as vilas possam controlá-los', standing: 0, heat: 0 }, { id: 'red-hands', name: 'Mãos Rubras', agenda: 'lucrar com crises de fronteira e contratos que ninguém quer assinar', standing: 0, heat: 0 }, { id: 'hunter-directorate', name: 'Diretoria de Caçadores', agenda: 'registrar, perseguir ou cooptar shinobi que escapam às vilas', standing: 0, heat: 0 }, { id: 'ashen-lotus', name: 'Lótus Cinzento', agenda: 'proteger civis e dissidentes que as grandes facções tratam como dano colateral', standing: 0, heat: 0 }]; state.world.careerCrisis ??= { defeatStreak: 0 }; state.rival ??= { name: 'Kaede', style: 'corte de vento e avanço', affinity: 'Vento', preferredTag: 'mobility', rank: state.character.rank, reputation: 1, rivalry: 12, stage: 0, stance: 'competitive', lastEncounterDay: -99, studiedStages: [], memory: 'uma rivalidade preservada de uma vida anterior' }; state.character.trait ??= { id: 'neutral', name: 'Neutro', description: 'Personagem criado antes da geração de traços.', modifiers: {} }; state.character.origin ??= { academyMemory: 'caderno de Academia', latentTag: 'perception', description: 'Uma origem preservada de uma vida anterior.' }; state.character.mentor ??= { id: 'mizuno', name: state.character.relationships.find(r => r.id === 'sensei')?.name ?? 'Mizuno', doctrine: 'guardian', description: 'Ensina a proteger uma linha antes de vencê-la.', bond: state.character.relationships.find(r => r.id === 'sensei')?.bond ?? 12, lessons: 0 }; state.character.dojutsuStage ??= 0; state.character.dojutsuInsight ??= 0; state.character.scars ??= []; state.character.inventory ??= { antidote: 0, 'sealing-slate': 0 }; state.character.research ??= { sealing: 0 }; state.character.modes ??= { sageInsight: 0, sageActive: false, sageForms: [], gateTraining: 0, openGates: 0 }; state.character.modes.sageForms ??= []; if (state.character.bijuu) state.character.bijuu.mantleActive ??= false; if (state.character.summon) state.character.summon.favor ??= 0; const slots = state.character.rank === 'Genin' ? 3 : state.character.rank === 'Chuunin' ? 4 : state.character.rank === 'Jounin' ? 5 : 0; const defaults = ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm']; if (slots) state.character.loadout = [...(state.character.loadout ?? []), ...defaults.filter(id => !(state.character.loadout ?? []).includes(id))].slice(0, slots); state.character.knownJutsu ??= [...state.character.loadout]; state.character.knownJutsu = [...new Set([...state.character.knownJutsu, ...state.character.loadout])]; if (state.combat) { state.combat.leadHistory ??= []; state.combat.supportUsage ??= {}; state.combat.summonUsed ??= false; } return state; }

function applyProgressionMigration(state: GameState): GameState {
  if (state.character.potential?.profile === 'prodigy' && !state.character.potential.specialty) {
    const [specialty, blindSpot] = Object.entries(state.character.attributes).sort(([, left], [, right]) => right - left).map(([key]) => key as keyof typeof state.character.attributes);
    state.character.potential.specialty = specialty;
    state.character.potential.blindSpot = blindSpot;
  }
  if (state.character.potential?.profile === 'late-bloomer' && state.character.potential.breakthrough && !state.character.potential.specialty) {
    const byTag = { offense: 'taijutsu', defense: 'stamina', control: 'handSeals', mobility: 'speed', perception: 'intelligence', support: 'chakraControl', stealth: 'genjutsu' } as const;
    state.character.potential.specialty = byTag[state.character.origin.latentTag];
  }
  const ceiling = state.character.rank === 'Academy' ? 6 : state.character.rank === 'Genin' ? 8 : state.character.rank === 'Chuunin' ? 10 : 12;
  const attributes = Object.fromEntries(Object.entries(state.character.attributes).map(([key, value]) => [key, Math.min(value, ceiling + Number(state.character.potential?.specialty === key))])) as GameState['character']['attributes'];
  const changed = Object.entries(attributes).some(([key, value]) => value !== state.character.attributes[key as keyof typeof state.character.attributes]);
  if (!changed) return state;
  state.character.attributes = attributes;
  state.character.chakraPool = Math.min(state.character.chakraPool, attributes.stamina * 10 + attributes.chakraControl * 2);
  state.chronicle.push({ day: state.character.day, type: 'migration', text: `Progressão recalibrada: atributos acima do limite de ${state.character.rank} (${ceiling}) foram ajustados.` });
  return state;
}

const ACTIVE_KEY = 'shinobi-chronicle.active.v1';
const HALL_KEY = 'shinobi-chronicle.hall.v1';
export type HallEntry = { seed: number; name: string; title: string; ending: string; biography: string; honors: string[]; completedAt: string };
export function loadStoredGame(): GameState | null {
  try { const raw = localStorage.getItem(ACTIVE_KEY); return raw ? applyProgressionMigration(decodeSave(raw)) : null; } catch { return null; }
}
export function storeGame(state: GameState): void { localStorage.setItem(ACTIVE_KEY, encodeSave(state)); }
export function clearStoredGame(): void { localStorage.removeItem(ACTIVE_KEY); }
export function loadHall(): HallEntry[] { try { return JSON.parse(localStorage.getItem(HALL_KEY) ?? '[]') as HallEntry[]; } catch { return []; } }
export function archiveLegacy(state: GameState): void {
  if (!state.legacy) return;
  const hall = loadHall(); const entry: HallEntry = { seed: state.seed, name: state.character.name, title: state.legacy.title, ending: state.legacy.ending, biography: state.legacy.biography, honors: state.legacy.honors, completedAt: new Date().toISOString() };
  localStorage.setItem(HALL_KEY, JSON.stringify([entry, ...hall.filter(existing => existing.seed !== state.seed)].slice(0, 30)));
}
