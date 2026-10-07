import { describe, expect, it } from 'vitest';
import raw from '../data/core.json';
import { validateContent } from '../domain/validate';
import { mergeContentPacks } from '../domain/mods';
import { decodeSave, encodeSave } from './save';
import { analyzeBuild, applyCommand, assessCharacter, createGame } from './simulation';
import { simulationEvents } from './events';

const content = validateContent(raw);
const genin = (seed = 88) => {
  let s = createGame('Aki', seed);
  s = applyCommand(s, { type: 'SET_TRAINING_FOCUS', attribute: 'intelligence' }, content);
  s = applyCommand(s, { type: 'SET_TRAINING_FOCUS', attribute: 'handSeals' }, content);
  s = applyCommand(s, { type: 'RESOLVE_ACADEMY_INTRO', choice: 'trace' }, content);
  while (s.character.attributes.intelligence + s.character.attributes.handSeals < 8) {
    const attribute = s.character.attributes.intelligence <= s.character.attributes.handSeals ? 'intelligence' : 'handSeals';
    s = applyCommand(s, { type: 'TRAIN', attribute }, content);
  }
  return applyCommand(s, { type: 'GRADUATE' }, content);
};
const runMission = (state: ReturnType<typeof createGame>) => {
  let s = applyCommand(state, { type: 'SET_COMBAT_PLAN', plan: 'contain' }, content);
  s = applyCommand(s, { type: 'RUN_MISSION' }, content);
  for (const [index, approach] of (['probe', 'commit', 'protect'] as const).entries()) s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach, jutsuId: s.character.loadout[index % s.character.loadout.length] }, content);
  return s;
};
const resolveTournament = (state: ReturnType<typeof createGame>) => {
  let s = state;
  for (const choice of ['read', 'control', 'commit'] as const) s = applyCommand(s, { type: 'RESOLVE_TOURNAMENT_ROUND', choice }, content);
  return s;
};
describe('content validation', () => {
  it('rejects unknown combat tags and duplicate ids', () => {
    expect(() => validateContent({ ...raw, jutsu: [{ ...raw.jutsu[0], tags: ['teleport'] }] })).toThrow('Invalid jutsu');
    expect(() => validateContent({ ...raw, jutsu: [raw.jutsu[0], raw.jutsu[0]] })).toThrow('Invalid jutsu');
  });
  it('merges data-only mod packs without allowing content id collisions', () => {
    const merged = mergeContentPacks(content, [{ id: 'quiet-tools', schemaVersion: 1, jutsu: [{ id: 'quiet-chime', name: 'Quiet Chime', tags: ['perception'], chakraCost: 4, mastery: 0, description: 'A mod-added scouting tool.' }] }]);
    expect(merged.jutsu.some(jutsu => jutsu.id === 'quiet-chime')).toBe(true);
    expect(() => mergeContentPacks(content, [{ id: 'collision', schemaVersion: 1, jutsu: [content.jutsu[0]] }])).toThrow('conflicts');
  });
  it('keeps a broad authored technique library with utility branches beyond direct offense', () => {
    expect(content.jutsu.length).toBeGreaterThanOrEqual(138);
    expect(content.jutsu.find(jutsu => jutsu.id === 'hostage-thread')?.tags).toEqual(expect.arrayContaining(['support', 'control']));
    expect(content.jutsu.find(jutsu => jutsu.id === 'horizon-needle')?.minimumRank).toBe('A');
  });
});
describe('career simulation', () => {
  it('writes a durable chronicle and publishes the corresponding domain event', () => {
    const seen: string[] = []; const unsubscribe = simulationEvents.subscribe(event => seen.push(event.type));
    let start = createGame('Aki'); start = applyCommand(start, { type: 'SET_TRAINING_FOCUS', attribute: 'intelligence' }, content); start = applyCommand(start, { type: 'SET_TRAINING_FOCUS', attribute: 'handSeals' }, content);
    const state = applyCommand(start, { type: 'TRAIN', attribute: 'intelligence' }, content);
    unsubscribe();
    expect(state.chronicle.at(-1)?.type).toBe('training');
    expect(seen).toContain('training');
  });
  it('requires Academy progression, and keeps rank separate from attributes', () => {
    const start = createGame('Aki');
    expect(() => applyCommand(start, { type: 'GRADUATE' }, content)).toThrow('Inteligência + Selos');
    const s = genin();
    expect(s.character.rank).toBe('Genin');
    expect(s.character.day).toBeGreaterThan(1);
    expect(s.character.attributes.intelligence + s.character.attributes.handSeals).toBeGreaterThanOrEqual(8);
  });
  it('enforces phase-specific training ceilings so the Academy cannot farm endgame grades', () => {
    let academy = createGame('Aki', 111);
    academy = { ...academy, character: { ...academy.character, attributes: { ...academy.character.attributes, intelligence: 6 }, development: { ...academy.character.development, focus: ['intelligence', 'handSeals'] } } };
    expect(() => applyCommand(academy, { type: 'TRAIN', attribute: 'intelligence' }, content)).toThrow('limite desta fase (6)');
    let s = genin(112);
    s = { ...s, character: { ...s.character, attributes: { ...s.character.attributes, ninjutsu: 8 }, development: { ...s.character.development, focus: ['ninjutsu', 'handSeals'] } } };
    expect(() => applyCommand(s, { type: 'TRAIN', attribute: 'ninjutsu' }, content)).toThrow('limite desta fase (8)');
  });
  it('lets a prodigy exceed the normal ceiling in one recorded signature without opening every stat to grinding', () => {
    const seed = Array.from({ length: 100 }, (_, value) => value + 1).find(value => createGame('Aki', value).character.potential.profile === 'prodigy')!;
    let s = createGame('Aki', seed); const specialty = s.character.potential.specialty!;
    s = { ...s, character: { ...s.character, rank: 'Genin', attributes: { ...s.character.attributes, [specialty]: 8 }, development: { phase: 'Genin', focus: [specialty, 'willpower'], sessions: 0, limit: 6 } } };
    s = applyCommand(s, { type: 'TRAIN', attribute: specialty }, content);
    expect(s.character.attributes[specialty]).toBe(9);
    expect(() => applyCommand(s, { type: 'TRAIN', attribute: specialty }, content)).toThrow('limite desta fase (9)');
  });
  it('makes stat growth a focused commitment instead of allowing every attribute to be maxed in one phase', () => {
    let s = createGame('Aki', 906);
    expect(() => applyCommand(s, { type: 'TRAIN', attribute: 'ninjutsu' }, content)).toThrow('Escolha dois focos');
    s = applyCommand(s, { type: 'SET_TRAINING_FOCUS', attribute: 'ninjutsu' }, content);
    s = applyCommand(s, { type: 'SET_TRAINING_FOCUS', attribute: 'chakraControl' }, content);
    expect(() => applyCommand(s, { type: 'TRAIN', attribute: 'taijutsu' }, content)).toThrow('não é foco');
    s = applyCommand(s, { type: 'TRAIN', attribute: 'ninjutsu' }, content);
    expect(() => applyCommand(s, { type: 'SET_TRAINING_FOCUS', attribute: 'taijutsu' }, content)).toThrow('já está em prática');
    s = { ...s, character: { ...s.character, development: { ...s.character.development, sessions: s.character.development.limit } } };
    expect(() => applyCommand(s, { type: 'TRAIN', attribute: 'ninjutsu' }, content)).toThrow('sessões decisivas');
  });
  it('opens each life with a resolved Academy scene that leaves a contextual field inclination', () => {
    let s = createGame('Aki', 515);
    expect(s.academyIntroduction?.prompt).toContain('primeiro exercício');
    s = applyCommand(s, { type: 'RESOLVE_ACADEMY_INTRO', choice: 'shield' }, content);
    expect(s.academyIntroduction).toBeUndefined();
    expect(s.character.origin.latentTag).toBe('support');
    expect(s.character.honor).toBe(1);
    expect(s.chronicle.at(-1)?.type).toBe('introduction');
  });
  it('creates varied but bounded starting profiles, including a deterministic trade-off trait', () => {
    const a = createGame('Aki', 707);
    const b = createGame('Aki', 707);
    expect(a.character).toEqual(b.character);
    expect(a.character.trait).toBeDefined();
    expect(a.character.potential).toBeDefined();
    expect(Object.values(a.character.attributes).every(value => value >= 1 && value <= 7)).toBe(true);
    const profiles = Array.from({ length: 100 }, (_, seed) => createGame('Aki', seed).character.potential.profile);
    expect(profiles).toContain('prodigy');
    expect(profiles).toContain('late-bloomer');
  });
  it('lets a difficult start awaken after three successful missions in the chosen field inclination', () => {
    const seed = Array.from({ length: 100 }, (_, value) => value + 1).find(value => createGame('Aki', value).character.potential.profile === 'late-bloomer')!;
    let s = genin(seed); const before = s.character.attributes.intelligence;
    s = { ...s, stats: { ...s.stats, successes: 2 }, offer: { id: 'breakthrough', rank: 'D', title: 'Primeiro avanço', objective: 'Proteger uma rota.', intel: 'A abertura é estreita.', statedRisk: 'baixo', dilemma: 'Teste.', reward: 1, hiddenThreat: 1, decision: 'protect', plan: 'contain', preparation: [] }, combat: { plan: 'contain', round: 0, advantage: 50, pressure: 1, chakra: 100, exposure: 0, leadHistory: [], supportUsage: {}, steps: [{ round: 0, success: true, text: 'O campo se abre.' }] } };
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'probe', jutsuId: 'binding-wire' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'commit', jutsuId: 'scouts-eye' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'protect', jutsuId: 'stone-guard' }, content);
    expect(s.character.potential.breakthrough).toBe(true);
    expect(s.character.attributes.intelligence).toBe(before + 2);
    expect(s.world.storyFlags).toContain('potential:late-bloomer:breakthrough');
  });
  it('is deterministic for the same state and command sequence', () => {
    const play = () => { let s = genin(21); s = applyCommand(s, { type: 'SET_LOADOUT', jutsuIds: ['binding-wire', 'scouts-eye', 'stone-guard'] }, content); s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content); s = applyCommand(s, { type: 'PREPARE', method: 'intel' }, content); return runMission(s); };
    expect(play()).toEqual(play());
  });
  it('round-trips a versioned save without changing the chronicle', () => {
    const state = genin(13); expect(decodeSave(encodeSave(state))).toEqual(state);
  });
  it('turns optional village time into concrete preparation, mastery, bonds and civic consequences', () => {
    let s = genin(93); const first = s.character.loadout[0], day = s.character.day;
    s = applyCommand(s, { type: 'SPEND_VILLAGE_DAY', activity: 'practice' }, content);
    expect(s.character.day).toBe(day + 1);
    expect(s.character.mastery[first]).toBeGreaterThanOrEqual(1);
    s = applyCommand(s, { type: 'SPEND_VILLAGE_DAY', activity: 'listen' }, content);
    expect(s.world.localIntel).toBe(1);
    const mentorBond = s.character.mentor.bond;
    s = applyCommand(s, { type: 'SPEND_VILLAGE_DAY', activity: 'mentor' }, content);
    expect(s.character.mentor.bond).toBe(mentorBond + 1);
    const tension = s.world.borderTension;
    s = applyCommand(s, { type: 'SPEND_VILLAGE_DAY', activity: 'patrol' }, content);
    expect(s.world.borderTension).toBe(Math.max(0, tension - 1));
    expect(s.chronicle.at(-1)?.type).toBe('village');
  });
  it('lets village practice plateau naturally and ends patrol farming when the frontier is calm', () => {
    let s = genin(930); const practiced = s.character.loadout[0];
    s = applyCommand(s, { type: 'SPEND_VILLAGE_DAY', activity: 'practice' }, content);
    s = applyCommand(s, { type: 'SPEND_VILLAGE_DAY', activity: 'practice' }, content);
    expect(s.character.mastery[practiced]).toBe(2);
    const ryo = s.character.ryo, honor = s.character.honor;
    s = { ...s, world: { ...s.world, borderTension: 0 } };
    s = applyCommand(s, { type: 'SPEND_VILLAGE_DAY', activity: 'patrol' }, content);
    expect(s.character.ryo).toBe(ryo + 3);
    expect(s.character.honor).toBe(honor);
  });
  it('creates a deterministic competitive roster and writes an annual OVR report without using OVR as combat resolution', () => {
    let s = genin(941); const assessment = assessCharacter(s, content);
    expect(s.competitive?.rosters.Genin).toHaveLength(10);
    expect(s.competitive?.rosters.Genin.every(entry => entry.age >= 10 && entry.age <= 15)).toBe(true);
    expect(assessment.overall).toBeGreaterThan(1);
    for (let season = 0; season < 4; season++) s = applyCommand(s, { type: 'ADVANCE_SEASON' }, content);
    expect(s.competitive?.annualReports).toHaveLength(1);
    expect(s.competitive?.annualReports[0].missionRecord).toContain('missões');
  });
  it('lets a build cross-train disciplines and unlocks their technique branches without changing bloodline', () => {
    let s = genin(942); s = { ...s, stats: { ...s.stats, successes: 2 }, character: { ...s.character, specialization: 'tracker', disciplines: [], ryo: 180 } };
    s = applyCommand(s, { type: 'STUDY_DISCIPLINE', id: 'sealwright' }, content);
    expect(s.character.disciplines).toContain('sealwright');
    const branch = content.jutsu.find(jutsu => jutsu.specialization === 'sealwright')!;
    s = { ...s, character: { ...s.character, rank: 'Chuunin', ryo: 999, knownJutsu: [...s.character.knownJutsu, ...(branch.requires ?? [])] } };
    expect(() => applyCommand(s, { type: 'LEARN_JUTSU', id: branch.id }, content)).not.toThrow();
  });
  it('migrates saves made before Sage disciplines and Resonant Mantle', () => {
    const legacy = JSON.parse(encodeSave(genin(14)));
    delete legacy.character.modes.sageForms;
    delete legacy.world.storyFlags;
    delete legacy.character.origin;
    delete legacy.character.mentor;
    delete legacy.rival;
    legacy.character.bijuu = { id: 'kurotsume', name: 'Kurotsume', trust: 0, respect: 0, control: 1, synchronization: 0, unrest: 4, cloakActive: false };
    const migrated = decodeSave(JSON.stringify(legacy));
    expect(migrated.character.modes.sageForms).toEqual([]);
    expect(migrated.character.bijuu?.mantleActive).toBe(false);
    expect(migrated.world.storyFlags).toEqual([]);
    expect(migrated.character.mentor.lessons).toBe(0);
    expect(migrated.rival.name).toBeTruthy();
  });
  it('produces explainable combat and outcome-linked reward', () => {
    let s = genin(55); s = applyCommand(s, { type: 'SET_LOADOUT', jutsuIds: ['stone-guard', 'binding-wire', 'scouts-eye'] }, content); s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content); s = applyCommand(s, { type: 'PREPARE', method: 'gear' }, content); s = runMission(s);
    expect(s.lastReport?.steps).toHaveLength(4);
    expect(s.lastReport?.steps[1].text).toContain('função');
    if (s.lastReport?.outcome === 'success') expect(s.lastReport.reward).toBeGreaterThan(0);
    if (s.lastReport?.outcome === 'failure') expect(s.lastReport.injury?.days).toBeGreaterThan(0);
  });
  it('requires a plan, then simulates a complete match from the equipped kit', () => {
    let s = genin(56); s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content);
    expect(() => applyCommand(s, { type: 'SIMULATE_MISSION' }, content)).toThrow('plano');
    s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'guard' }, content);
    s = applyCommand(s, { type: 'SIMULATE_MISSION' }, content);
    expect(s.combat).toBeUndefined();
    expect(s.lastReport?.steps).toHaveLength(4);
    expect(s.lastReport?.steps.slice(1).some(step => step.text.includes('posição'))).toBe(true);
  });
  it('uses the equipped kit as a sequence and prevents repeating the same lead immediately', () => {
    let s = genin(57); s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content); s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'contain' }, content); s = applyCommand(s, { type: 'RUN_MISSION' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'probe', jutsuId: 'binding-wire' }, content);
    expect(s.combat?.steps.at(-1)?.text).toContain("Scout's Eye entra como continuidade");
    expect(() => applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'probe', jutsuId: 'binding-wire' }, content)).toThrow('Alterne a técnica líder');
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'protect', jutsuId: 'scouts-eye' }, content);
    expect(s.combat?.leadHistory).toEqual(['binding-wire', 'scouts-eye']);
  });
  it('keeps career promotion and a final legacy behind meaningful conditions', () => {
    let s = genin(4);
    expect(() => applyCommand(s, { type: 'END_CAREER' }, content)).toThrow('Chuunin');
    s = { ...s, stats: { ...s.stats, successes: 3 }, character: { ...s.character, reputation: 4, attributes: Object.fromEntries(Object.keys(s.character.attributes).map(key => [key, 10])) as typeof s.character.attributes } };
    s = applyCommand(s, { type: 'START_REGIONAL_CIRCUIT' }, content);
    s = applyCommand(s, { type: 'RESOLVE_REGIONAL_CIRCUIT', choice: 'shield' }, content);
    s = applyCommand(s, { type: 'PROMOTE' }, content);
    expect(s.tournament?.kind).toBe('chuunin');
    s = resolveTournament(s);
    expect(s.character.rank).toBe('Chuunin');
    expect(s.character.loadout).toHaveLength(4);
    s = applyCommand(s, { type: 'END_CAREER' }, content);
    expect(s.legacy?.ending).toBe('retired');
    expect(s.legacy?.biography).toContain('completou');
  });
  it('turns the Chuunin exam into a seeded regional bracket, not an automatic rank check', () => {
    let s = genin(515);
    s = { ...s, stats: { ...s.stats, successes: 3 }, character: { ...s.character, reputation: 4, attributes: Object.fromEntries(Object.keys(s.character.attributes).map(key => [key, 10])) as typeof s.character.attributes } };
    s = applyCommand(s, { type: 'START_REGIONAL_CIRCUIT' }, content);
    s = applyCommand(s, { type: 'RESOLVE_REGIONAL_CIRCUIT', choice: 'trace' }, content);
    s = applyCommand(s, { type: 'PROMOTE' }, content);
    expect(s.tournament?.entrants).toHaveLength(3);
    s = resolveTournament(s);
    expect(s.character.rank).toBe('Chuunin');
    expect(s.world.secrets.some(secret => secret.includes('Circuito Regional'))).toBe(true);
    expect(s.chronicle.at(-1)?.text).toContain('Chave concluída');
  });
  it('makes the regional Genin circuit establish a flexible field signature before the Chuunin exam', () => {
    let s = genin(717);
    s = { ...s, stats: { ...s.stats, successes: 2 } };
    s = applyCommand(s, { type: 'START_REGIONAL_CIRCUIT' }, content);
    expect(s.regionalCircuit?.host).toBe('Vale das Pontes');
    s = applyCommand(s, { type: 'RESOLVE_REGIONAL_CIRCUIT', choice: 'parley' }, content);
    expect(s.character.geninFieldMark).toBe('mediator');
    expect(s.world.councilTrust).toBe(1);
    expect(() => applyCommand({ ...s, stats: { ...s.stats, successes: 3 }, character: { ...s.character, reputation: 4, geninFieldMark: undefined } }, { type: 'PROMOTE' }, content)).toThrow('Circuito Regional');
  });
  it('unlocks career-specific S-rank operations only after an earned Jounin appointment', () => {
    let s = genin(616);
    s = { ...s, stats: { ...s.stats, successes: 16, highestMission: 'A' }, world: { ...s.world, councilTrust: 9 }, character: { ...s.character, rank: 'Jounin', reputation: 19, loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'] } };
    s = applyCommand(s, { type: 'CHOOSE_CAREER_PATH', path: 'commander' }, content);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.character.careerPath).toBe('commander');
    expect(s.offer?.rank).toBe('S');
    expect(['Sete Pontes', 'O Cerco Silencioso', 'Mapa das Ausências']).toContain(s.offer?.title);
  });
  it('uses a three-round international Jounin bracket instead of an automatic promotion', () => {
    let s = genin(617);
    s = { ...s, stats: { ...s.stats, successes: 8 }, character: { ...s.character, rank: 'Chuunin', reputation: 12, attributes: Object.fromEntries(Object.keys(s.character.attributes).map(key => [key, 10])) as typeof s.character.attributes, loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'] } };
    s = applyCommand(s, { type: 'PROMOTE' }, content);
    expect(s.tournament?.kind).toBe('jounin');
    expect(s.tournament?.host).toBe('Cúpula das Cinco Rotas');
    s = resolveTournament(s);
    expect(s.character.rank).toBe('Jounin');
    expect(s.character.loadout).toHaveLength(5);
  });
  it('grows the base technique deck by rank while keeping bloodline, summons and modes outside it', () => {
    const s = genin(818);
    expect(s.character.loadout).toHaveLength(3);
    expect(s.character.bloodline).toBeUndefined();
    expect(s.character.summon).toBeUndefined();
    expect(s.character.modes.openGates).toBe(0);
  });
  it('keeps learned techniques separate from equipped slots and preserves their mastery record', () => {
    let s = genin(819); s = { ...s, character: { ...s.character, ryo: 100 } };
    expect(() => applyCommand(s, { type: 'SET_LOADOUT', jutsuIds: ['wind-cutter', 'binding-wire', 'scouts-eye'] }, content)).toThrow('ainda não foi aprendida');
    s = applyCommand(s, { type: 'LEARN_JUTSU', id: 'wind-cutter' }, content);
    s = applyCommand(s, { type: 'SET_LOADOUT', jutsuIds: ['wind-cutter', 'binding-wire', 'scouts-eye'] }, content);
    expect(s.character.knownJutsu).toContain('wind-cutter');
    expect(s.character.loadout[0]).toBe('wind-cutter');
    expect(s.character.mastery['wind-cutter']).toBe(0);
  });
  it('enforces technique-tree prerequisites instead of treating advanced jutsu as a shop list', () => {
    let s = genin(820); s = { ...s, character: { ...s.character, rank: 'Chuunin', ryo: 200, knownJutsu: ['scouts-eye', 'stone-guard'], loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'] } };
    expect(() => applyCommand(s, { type: 'LEARN_JUTSU', id: 'silken-snare' }, content)).toThrow('Binding Wire');
    s = { ...s, character: { ...s.character, knownJutsu: [...s.character.knownJutsu, 'binding-wire'] } };
    s = applyCommand(s, { type: 'LEARN_JUTSU', id: 'silken-snare' }, content);
    expect(s.character.knownJutsu).toContain('silken-snare');
  });
  it('keeps specialization branches distinct even when their parent techniques are known', () => {
    let s = genin(822); s = { ...s, character: { ...s.character, rank: 'Chuunin', ryo: 500, knownJutsu: [...s.character.knownJutsu, 'ember-thread', 'sealing-mark'], loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'] } };
    expect(() => applyCommand(s, { type: 'LEARN_JUTSU', id: 'cinder-seal' }, content)).toThrow('sealwright');
    s = applyCommand(s, { type: 'CHOOSE_PATH', kind: 'specialization', id: 'sealwright' }, content);
    s = applyCommand(s, { type: 'LEARN_JUTSU', id: 'cinder-seal' }, content);
    expect(s.character.knownJutsu).toContain('cinder-seal');
  });
  it('gives every specialization a contextual field rule and exposes build synergies and gaps', () => {
    let s = genin(823);
    s = applyCommand(s, { type: 'CHOOSE_PATH', kind: 'specialization', id: 'shadow-runner' }, content);
    const readout = analyzeBuild(s, content);
    expect(readout.roles).toContain('stealth');
    expect(readout.synergies.some(text => text.includes('Mobilidade + furtividade'))).toBe(true);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content);
    s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'infiltrate' }, content);
    s = applyCommand(s, { type: 'RUN_MISSION' }, content);
    expect(s.combat?.steps[0].text).toContain('Shadow Runner');
    expect(s.combat?.exposure).toBe(0);
  });
  it('gives an active evolved dōjutsu one explicit, costly combat intervention', () => {
    let s = genin(821); s = { ...s, character: { ...s.character, bloodline: 'kurogane-eye', dojutsuActive: true, dojutsuStage: 1 } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content); s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'contain' }, content); s = applyCommand(s, { type: 'RUN_MISSION' }, content);
    const pressure = s.combat!.pressure;
    s = applyCommand(s, { type: 'FOCUS_DOJUTSU' }, content);
    expect(s.combat?.ocularUsed).toBe(true);
    expect(s.combat?.pressure).toBe(Math.max(0, pressure - 2));
    expect(s.character.dojutsuStrain).toBe(2);
  });
  it('advances world time through a deterministic seasonal event', () => {
    const a = applyCommand(genin(909), { type: 'ADVANCE_SEASON' }, content);
    const b = applyCommand(genin(909), { type: 'ADVANCE_SEASON' }, content);
    expect(a).toEqual(b);
    expect(a.character.day).toBeGreaterThan(90);
    expect(['world', 'relationship', 'npc', 'narrative']).toContain(a.chronicle.at(-1)?.type);
  });
  it('requires an explicit mission priority and makes that priority part of the report', () => {
    let s = genin(71); s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(() => applyCommand(s, { type: 'RUN_MISSION' }, content)).toThrow('prioridade');
    s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'negotiate' }, content);
    s = runMission(s);
    expect(s.lastReport?.decision).toBe('negotiate');
    expect(s.character.factionTrust.underworld).toBeGreaterThanOrEqual(2);
  });
  it('persists NPC availability and gates team composition by relationship', () => {
    let s = genin(17);
    expect(() => applyCommand(s, { type: 'TOGGLE_TEAM_MEMBER', id: 'mira' }, content)).toThrow('vínculo 8');
    s = applyCommand(s, { type: 'BUILD_NPC_BOND', id: 'mira' }, content);
    s = applyCommand(s, { type: 'TOGGLE_TEAM_MEMBER', id: 'mira' }, content);
    expect(s.team.memberIds).toContain('mira');
    expect(s.npcs.find(n => n.id === 'mira')?.memory).toContain('objetivo');
  });
  it('turns a persistent NPC moment into a consequential world secret', () => {
    let s = genin(33);
    s = { ...s, character: { ...s.character, attributes: { ...s.character.attributes, intelligence: 4 } }, narrative: { npcId: 'mira', prompt: 'Mira asks whether to expose a border map.', choices: ['support', 'challenge', 'expose'] } };
    s = applyCommand(s, { type: 'RESOLVE_NARRATIVE', choice: 'expose' }, content);
    expect(s.narrative).toBeUndefined();
    expect(s.world.secrets).toHaveLength(1);
    expect(s.npcs.find(n => n.id === 'mira')?.arcStage).toBe(1);
    expect(s.character.honor).toBe(1);
  });
  it('makes Bijuu cloak depend on a real control path and resolves its field state', () => {
    let s = genin(101);
    s = applyCommand(s, { type: 'FORM_BIJUU_LINK', id: 'kurama' }, content);
    expect(() => applyCommand(s, { type: 'TOGGLE_CLOAK' }, content)).toThrow('Control 4');
    s = applyCommand(s, { type: 'CULTIVATE_BIJUU', approach: 'suppress' }, content);
    s = applyCommand(s, { type: 'TOGGLE_CLOAK' }, content);
    expect(s.character.bijuu?.cloakActive).toBe(true);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content);
    s = runMission(s);
    expect(s.character.bijuu?.cloakActive).toBe(false);
    expect(s.character.bijuu?.unrest).toBeGreaterThan(0);
  });
  it('evolves dōjutsu through repeated low-strain study and makes summoning reciprocal', () => {
    let s = genin(202);
    s = applyCommand(s, { type: 'CHOOSE_PATH', kind: 'bloodline', id: 'kurogane-eye' }, content);
    s = applyCommand(s, { type: 'CULTIVATE_DOJUTSU' }, content);
    s = applyCommand(s, { type: 'CULTIVATE_DOJUTSU' }, content);
    s = applyCommand(s, { type: 'CULTIVATE_DOJUTSU' }, content);
    expect(s.character.dojutsuStage).toBe(1);
    s = applyCommand(s, { type: 'CHOOSE_PATH', kind: 'summon', id: 'toad-contract' }, content);
    s = applyCommand(s, { type: 'CULTIVATE_SUMMON' }, content);
    expect(s.character.summon?.favor).toBeGreaterThan(0);
  });
  it('makes logistics consumable and research alter a named preparation rule', () => {
    let s = genin(303); s = { ...s, character: { ...s.character, ryo: 100 } };
    s = applyCommand(s, { type: 'BUY_SUPPLY', item: 'sealing-slate' }, content);
    expect(s.character.inventory['sealing-slate']).toBe(1);
    s = applyCommand(s, { type: 'RESEARCH', project: 'sealing' }, content);
    expect(s.character.research.sealing).toBe(1);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    s = applyCommand(s, { type: 'PREPARE', method: 'seal' }, content);
    expect(s.character.inventory['sealing-slate']).toBe(0);
    expect(s.offer?.preparation).toContain('seal');
  });
  it('offers a one-click recommended preparation instead of requiring a checklist', () => {
    let s = genin(404);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    s = applyCommand(s, { type: 'PREPARE_SMART' }, content);
    expect(s.offer?.preparation).toContain('intel');
    expect(s.chronicle.at(-1)?.text).toContain('Preparação recomendada');
  });
  it('gates Sage Mode and the Gates behind personal training, then clears them after field use', () => {
    let s = genin(505);
    s = { ...s, character: { ...s.character, attributes: { ninjutsu: 3, taijutsu: 3, genjutsu: 3, intelligence: 5, strength: 5, speed: 3, stamina: 5, handSeals: 3, chakraControl: 5, willpower: 3 }, chakraPool: 50 } };
    s = applyCommand(s, { type: 'CULTIVATE_SAGE' }, content); s = applyCommand(s, { type: 'CULTIVATE_SAGE' }, content); s = applyCommand(s, { type: 'CULTIVATE_SAGE' }, content);
    s = applyCommand(s, { type: 'ATTUNE_SAGE_FORM', form: 'stone' }, content);
    s = applyCommand(s, { type: 'TOGGLE_SAGE' }, content);
    s = applyCommand(s, { type: 'TRAIN_GATES' }, content); s = applyCommand(s, { type: 'TRAIN_GATES' }, content);
    s = applyCommand(s, { type: 'OPEN_GATES', level: 1 }, content);
    expect(s.character.modes.sageActive).toBe(true);
    expect(s.character.modes.openGates).toBe(1);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content); s = runMission(s);
    expect(s.character.modes.sageActive).toBe(false);
    expect(s.character.modes.openGates).toBe(0);
  });
  it('unlocks distinct Sage forms and the Third Gate behind their own thresholds', () => {
    let s = genin(506);
    s = { ...s, character: { ...s.character, attributes: { ninjutsu: 3, taijutsu: 3, genjutsu: 3, intelligence: 5, strength: 5, speed: 3, stamina: 5, handSeals: 3, chakraControl: 5, willpower: 5 }, chakraPool: 50, health: 80, modes: { sageInsight: 5, sageActive: false, sageForms: [], gateTraining: 6, openGates: 0 } } };
    s = applyCommand(s, { type: 'ATTUNE_SAGE_FORM', form: 'veil' }, content);
    expect(s.character.modes.sageForms).toContain('veil');
    expect(s.character.modes.sageForm).toBe('veil');
    s = applyCommand(s, { type: 'OPEN_GATES', level: 3 }, content);
    expect(s.character.modes.openGates).toBe(3);
  });
  it('makes advanced Bijuu and summons field interventions with explicit costs', () => {
    let s = genin(507);
    s = { ...s, character: { ...s.character, bijuu: { id: 'kurotsume', name: 'Kurotsume', trust: 4, respect: 2, control: 6, synchronization: 5, unrest: 2, cloakActive: false, mantleActive: false }, summon: { id: 'moth-contract', name: 'Contrato das Mariposas', bond: 4, favor: 2 } } };
    s = applyCommand(s, { type: 'TOGGLE_MANTLE' }, content);
    expect(s.character.bijuu?.mantleActive).toBe(true);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content);
    s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'contain' }, content);
    s = applyCommand(s, { type: 'RUN_MISSION' }, content);
    const pressure = s.combat!.pressure;
    s = applyCommand(s, { type: 'CALL_SUMMON' }, content);
    expect(s.combat?.summonUsed).toBe(true);
    expect(s.combat!.pressure).toBeLessThanOrEqual(pressure);
    expect(s.character.summon?.favor).toBe(0);
  });
  it('loads the expanded catalogue and makes Kekkei Genkai techniques change field rules', () => {
    expect(content.jutsu).toHaveLength(138);
    expect(content.dojutsu.map(path => path.id)).toEqual(expect.arrayContaining(['kurogane-eye', 'lumen-eye', 'ashen-eye', 'sharingan', 'byakugan', 'rinnegan', 'tenseigan', 'ketsuryugan', 'jogan', 'kagura-eye']));
    expect(content.bijuu.map(beast => beast.id)).toEqual(['shukaku', 'matatabi', 'isobu', 'son-goku', 'kokuo', 'saiken', 'chomei', 'gyuki', 'kurama', 'juubi']);
    expect(content.bloodlines.map(path => path.id)).toEqual(expect.arrayContaining(['wood-release', 'ice-release', 'crystal-release', 'yin-yang-release', 'sand-style', 'magnet-release', 'lava-release', 'boil-release', 'scorch-release', 'storm-release', 'explosion-release', 'metal-release', 'fire-style', 'water-style', 'wind-style', 'earth-style', 'lightning-style']));
    let s = genin(508);
    s = { ...s, character: { ...s.character, ryo: 200 } };
    s = applyCommand(s, { type: 'CHOOSE_PATH', kind: 'bloodline', id: 'wood-release' }, content);
    expect(() => applyCommand(s, { type: 'LEARN_JUTSU', id: 'frost-breath' }, content)).toThrow('linhagem');
    s = applyCommand(s, { type: 'LEARN_JUTSU', id: 'wood-sprout' }, content);
    s = applyCommand(s, { type: 'SET_LOADOUT', jutsuIds: ['wood-sprout', 'binding-wire', 'stone-guard'] }, content);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content);
    s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'contain' }, content);
    s = applyCommand(s, { type: 'RUN_MISSION' }, content);
    expect(s.combat?.steps[0].text).toContain('Mokuton reivindica o terreno');
  });
  it('gives each new dōjutsu a selectable technique and a distinct costly field focus', () => {
    let s = genin(812); s = { ...s, character: { ...s.character, bloodline: 'sharingan', dojutsuActive: true, dojutsuStage: 1, ryo: 100 } };
    s = applyCommand(s, { type: 'LEARN_JUTSU', id: 'sharingan-counter' }, content);
    expect(s.character.knownJutsu).toContain('sharingan-counter');
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content); s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'contain' }, content); s = applyCommand(s, { type: 'RUN_MISSION' }, content); s = applyCommand(s, { type: 'FOCUS_DOJUTSU' }, content);
    expect(s.combat?.steps[0].text).toContain('Sharingan memoriza');
  });
  it('reserves the Juubi and Rikudō Mode for a fully developed Jounin containment route', () => {
    let s = genin(813); s = { ...s, stats: { ...s.stats, successes: 12 }, character: { ...s.character, rank: 'Jounin', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'], attributes: { ...s.character.attributes, willpower: 8, chakraControl: 8 }, bijuu: { id: 'juubi', name: 'Jūbi, a Dez-Caudas', trust: 5, respect: 8, control: 12, synchronization: 10, unrest: 2, cloakActive: true, mantleActive: true } } };
    s = applyCommand(s, { type: 'TOGGLE_RIKUDO' }, content);
    expect(s.character.modes.rikudoActive).toBe(true);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content); s = applyCommand(s, { type: 'MISSION_DECISION', decision: 'protect' }, content); s = applyCommand(s, { type: 'SET_COMBAT_PLAN', plan: 'contain' }, content); s = applyCommand(s, { type: 'RUN_MISSION' }, content);
    expect(s.combat?.steps[0].text).toContain('Modo Rikudō estabiliza');
  });
  it('offers a two-stage personal affinity arc before ordinary high-rank work', () => {
    let s = genin(509);
    s = { ...s, stats: { ...s.stats, successes: 6 }, character: { ...s.character, rank: 'Chuunin', bloodline: 'sand-style', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('affinity:sand-style:first');
    expect(s.offer?.title).toContain('Claim of sand-style');
  });
  it('turns completed affinity chapters into a final S-rank legacy operation', () => {
    let s = genin(513);
    s = { ...s, stats: { ...s.stats, successes: 16 }, world: { ...s.world, storyFlags: ['affinity:sand-style:first', 'affinity:sand-style:second'] }, character: { ...s.character, rank: 'Jounin', careerPath: 'commander', bloodline: 'sand-style', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.rank).toBe('S');
    expect(s.offer?.arcId).toBe('affinity:sand-style:final');
    expect(s.offer?.title).toContain('Legacy of sand-style');
  });
  it('gives each selected career authored A and S operations through the ordinary mission flow', () => {
    let s = genin(512);
    s = { ...s, stats: { ...s.stats, successes: 18 }, character: { ...s.character, rank: 'Jounin', careerPath: 'anbu', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('career:anbu:mirror');
    s = { ...s, offer: undefined, world: { ...s.world, storyFlags: ['career:anbu:mirror'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('career:anbu:threshold');
  });
  it('makes every Bijū route narratively distinct and gives Gates their own three-stage arc', () => {
    let bijuu = genin(515);
    bijuu = { ...bijuu, stats: { ...bijuu.stats, successes: 6 }, character: { ...bijuu.character, rank: 'Chuunin', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], bijuu: { id: 'shukaku', name: 'Shukaku, o Ichibi', trust: 5, respect: 1, control: 3, synchronization: 0, unrest: 2, cloakActive: false } } };
    bijuu = applyCommand(bijuu, { type: 'OFFER_MISSION' }, content);
    expect(bijuu.offer?.arcId).toBe('bijuu:first');
    expect(bijuu.offer?.title).toContain('Deserto que Escuta');
    let gates = genin(516);
    gates = { ...gates, stats: { ...gates.stats, successes: 6 }, character: { ...gates.character, rank: 'Chuunin', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], modes: { ...gates.character.modes, gateTraining: 2 } } };
    gates = applyCommand(gates, { type: 'OFFER_MISSION' }, content);
    expect(gates.offer?.arcId).toBe('gates:first');
    expect(gates.offer?.title).toBe('O Corpo como Promessa');
  });
  it('gives each dōjutsu lineage its own three-stage operation rather than an affinity reskin', () => {
    let s = genin(514);
    s = { ...s, stats: { ...s.stats, successes: 14 }, character: { ...s.character, rank: 'Jounin', bloodline: 'kurogane-eye', dojutsuStage: 1, dojutsuInsight: 2, loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('dojutsu:kurogane-eye:first');
    expect(s.offer?.title).toContain('Fios de Intenção');
    s = { ...s, offer: undefined, stats: { ...s.stats, successes: 16 }, world: { ...s.world, storyFlags: ['dojutsu:kurogane-eye:first', 'dojutsu:kurogane-eye:second'] }, character: { ...s.character, careerPath: 'commander', dojutsuStage: 3, dojutsuInsight: 6 } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('dojutsu:kurogane-eye:final');
    expect(s.offer?.title).toContain('O Último Vetor');
  });
  it('turns a severe defeat into a recoverable injury with a lasting field consequence', () => {
    let s = genin(901);
    s = { ...s, offer: { id: 'forced-loss', rank: 'D', title: 'Campo sem saída', objective: 'Sobreviver à emboscada.', intel: 'Nada confirma a rota de saída.', statedRisk: 'teste', dilemma: 'Retirar ou arriscar.', reward: 0, hiddenThreat: 20, decision: 'protect', plan: 'pressure', preparation: [] }, combat: { plan: 'pressure', round: 0, advantage: -10, pressure: 20, chakra: 0, exposure: 0, leadHistory: [], supportUsage: {}, steps: [{ round: 0, success: false, text: 'A emboscada fecha as rotas.' }] } };
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'commit', jutsuId: 'binding-wire' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'commit', jutsuId: 'scouts-eye' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'commit', jutsuId: 'stone-guard' }, content);
    expect(s.lastReport?.outcome).toBe('failure');
    expect(s.character.injury?.scar?.name).toBe('Impacto mal curado');
    for (let i = 0; i < 6; i++) s = applyCommand(s, { type: 'REST' }, content);
    expect(s.character.injury).toBeUndefined();
    expect(s.character.scars.map(scar => scar.id)).toContain('old-impact');
  });
  it('makes faction agendas surface in high-rank briefings and lets a defeat streak open a missing-nin rupture', () => {
    let s = genin(902);
    s = { ...s, stats: { ...s.stats, successes: 6 }, character: { ...s.character, rank: 'Chuunin', bloodline: 'sand-style', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.factionId).toBe('eclipse-covenant');
    expect(s.offer?.intel).toContain('Pacto do Eclipse');
    s = { ...s, offer: undefined, world: { ...s.world, careerCrisis: { defeatStreak: 3, lastSetback: 'Operação perdida', warrant: 'Dossiê aberto' } } };
    s = applyCommand(s, { type: 'CHOOSE_CAREER_PATH', path: 'rogue' }, content);
    expect(s.world.missingNin?.huntersAlerted).toBe(true);
    expect(s.world.missingNin?.reason).toContain('dossiê');
  });
  it('turns faction standing into a distinct authored operation instead of a generic mission reskin', () => {
    let s = genin(903);
    s = { ...s, stats: { ...s.stats, successes: 6 }, world: { ...s.world, storyFlags: ['affinity:sand-style:first'], factions: s.world.factions.map(faction => faction.id === 'eclipse-covenant' ? { ...faction, standing: 2 } : faction) }, character: { ...s.character, rank: 'Chuunin', bloodline: 'sand-style', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('faction:eclipse-covenant:terms');
    expect(s.offer?.title).toBe('O Preço do Eclipse');
    expect(s.offer?.intel).toContain('Pacto do Eclipse');
  });
  it('makes the first faction contract write a decision-specific political consequence', () => {
    let s = genin(906);
    s = { ...s, stats: { ...s.stats, successes: 6 }, world: { ...s.world, storyFlags: ['affinity:sand-style:first'], factions: s.world.factions.map(faction => faction.id === 'eclipse-covenant' ? { ...faction, standing: 2 } : faction) }, character: { ...s.character, rank: 'Chuunin', bloodline: 'sand-style', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    const honor = s.character.honor;
    s = { ...s, offer: { ...s.offer!, decision: 'protect', plan: 'contain' }, combat: { plan: 'contain', round: 0, advantage: 20, pressure: 0, chakra: 100, exposure: 0, leadHistory: [], supportUsage: {}, steps: [] } };
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'protect', jutsuId: 'binding-wire' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'probe', jutsuId: 'scouts-eye' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'protect', jutsuId: 'stone-guard' }, content);
    expect(s.world.storyFlags).toContain('faction:eclipse-covenant:terms:protect');
    expect(s.character.honor).toBeGreaterThan(honor);
    expect(s.world.secrets.at(-1)).toContain('portadores raros');
  });
  it('continues a resolved faction contract into an A-rank consequence whose priority changes the world', () => {
    let s = genin(905);
    s = { ...s, stats: { ...s.stats, successes: 14 }, world: { ...s.world, storyFlags: ['affinity:sand-style:first', 'affinity:sand-style:second', 'faction:eclipse-covenant:terms'], factions: s.world.factions.map(faction => faction.id === 'eclipse-covenant' ? { ...faction, standing: 3 } : faction) }, character: { ...s.character, rank: 'Jounin', bloodline: 'sand-style', loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('faction:eclipse-covenant:archive');
    expect(s.offer?.title).toBe('O Arquivo que Respira');
    const councilBefore = s.world.councilTrust;
    s = { ...s, offer: { ...s.offer!, decision: 'protect', plan: 'contain' }, combat: { plan: 'contain', round: 0, advantage: 20, pressure: 0, chakra: 100, exposure: 0, leadHistory: [], supportUsage: {}, steps: [] } };
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'protect', jutsuId: 'binding-wire' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'probe', jutsuId: 'scouts-eye' }, content);
    s = applyCommand(s, { type: 'RESOLVE_COMBAT_BEAT', approach: 'protect', jutsuId: 'stone-guard' }, content);
    expect(s.world.storyFlags).toContain('faction:eclipse-covenant:archive:protect');
    expect(s.world.councilTrust).toBeGreaterThan(councilBefore);
    expect(s.character.honor).toBeGreaterThan(0);
  });
  it('makes a missing-nin face the hunters before a conditional return, never a free reset', () => {
    let s = genin(904);
    s = { ...s, stats: { ...s.stats, successes: 14 }, world: { ...s.world, councilTrust: 1, storyFlags: ['faction:hunter-directorate:first'], missingNin: { reason: 'dossiê do conselho e caçada iminente', wantedLevel: 2, huntersAlerted: true } }, character: { ...s.character, rank: 'Jounin', careerPath: 'rogue', honor: 4, notoriety: 9, loadout: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'], knownJutsu: ['binding-wire', 'scouts-eye', 'stone-guard', 'mist-step', 'warding-palm'] } };
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    expect(s.offer?.arcId).toBe('faction:hunter-directorate:reckoning');
    expect(() => applyCommand(s, { type: 'SEEK_PARDON' }, content)).toThrow('Primeiro resolva Nome diante do Conselho');
    s = { ...s, offer: undefined, world: { ...s.world, storyFlags: [...s.world.storyFlags, 'faction:hunter-directorate:reckoning'] } };
    s = applyCommand(s, { type: 'SEEK_PARDON' }, content);
    expect(s.world.missingNin).toBeUndefined();
    expect(s.character.careerPath).toBeUndefined();
    expect(s.world.storyFlags).toContain('faction:hunter-directorate:pardon');
    expect(s.character.notoriety).toBe(5);
  });
  it('generates a seeded mentor and turns a limited lesson into contextual mission counsel', () => {
    let s = genin(510);
    const mentor = s.character.mentor;
    const totalBefore = Object.values(s.character.attributes).reduce((sum, value) => sum + value, 0);
    s = applyCommand(s, { type: 'MENTOR_LESSON' }, content);
    expect(s.character.mentor.lessons).toBe(1);
    expect(Object.values(s.character.attributes).reduce((sum, value) => sum + value, 0)).toBe(totalBefore + 1);
    expect(s.character.relationships.find(r => r.id === 'sensei')?.name).toBe(mentor.name);
    s = applyCommand(s, { type: 'OFFER_MISSION' }, content);
    s = applyCommand(s, { type: 'CONSULT_MENTOR' }, content);
    expect(s.offer?.preparation).toContain('mentor');
  });
  it('gives the seeded rival a build identity and one study reward per career phase', () => {
    let s = genin(511);
    const totalBefore = Object.values(s.character.attributes).reduce((sum, value) => sum + value, 0);
    expect(s.rival.style).toBeTruthy();
    s = applyCommand(s, { type: 'RIVAL_ENCOUNTER', approach: 'study' }, content);
    expect(s.rival.studiedStages).toContain(1);
    expect(Object.values(s.character.attributes).reduce((sum, value) => sum + value, 0)).toBe(totalBefore + 1);
    expect(() => applyCommand(s, { type: 'RIVAL_ENCOUNTER', approach: 'study' }, content)).toThrow('tempo');
  });
  it('generates deterministic but varied original shinobi names for mentor and rival', () => {
    const sameA = createGame('Aki', 611), sameB = createGame('Aki', 611), different = createGame('Aki', 612);
    expect(sameA.character.mentor.name).toBe(sameB.character.mentor.name);
    expect(sameA.rival.name).toBe(sameB.rival.name);
    expect(sameA.npcs.map(npc => npc.name)).not.toEqual(['Toma', 'Mira', 'Kaede']);
    expect(`${sameA.character.mentor.name}:${sameA.rival.name}`).not.toBe(`${different.character.mentor.name}:${different.rival.name}`);
  });
});
