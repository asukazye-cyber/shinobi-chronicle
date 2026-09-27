export type Tag = 'offense' | 'defense' | 'control' | 'mobility' | 'perception' | 'support' | 'stealth';
export type Attribute = 'ninjutsu' | 'taijutsu' | 'genjutsu' | 'intelligence' | 'strength' | 'speed' | 'stamina' | 'handSeals' | 'chakraControl' | 'willpower';
export type Rank = 'Academy' | 'Genin' | 'Chuunin' | 'Jounin' | 'Retired' | 'Fallen';
export type MissionRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type Jutsu = { id: string; name: string; tags: Tag[]; chakraCost: number; mastery: number; description: string; minimumRank?: MissionRank; requires?: string[]; specialization?: string; bloodline?: string };
export type Content = { schemaVersion: 1; jutsu: Jutsu[]; specializations: { id: string; name: string; unlock: string; description: string }[]; bloodlines: { id: string; name: string; assetSlot?: string; hook: string }[]; summons: { id: string; name: string; assetSlot?: string; terms: string }[]; bijuu: { id: string; name: string; temperament: string; assetSlot?: string }[] };
export type Scar = { id: string; name: string; adaptation: string; fieldCondition: string };
export type Injury = { name: string; severity: number; days: number; scar?: Scar };
export type ChronicleEntry = { day: number; type: string; text: string };
export type Relationship = { id: 'sensei' | 'rival' | 'teammate'; name: string; bond: number; memory: string };
export type NpcStatus = 'available' | 'deployed' | 'injured' | 'distant';
export type Npc = { id: string; name: string; role: 'scout' | 'medic' | 'striker' | 'rival'; bond: number; status: NpcStatus; goal: string; memory: string; arcStage: number };
export type Team = { memberIds: string[]; cohesion: number; lastMission?: string };
export type BijuuApproach = 'cooperate' | 'suppress' | 'dominate';
export type BijuuState = { id: string; name: string; trust: number; respect: number; control: number; synchronization: number; unrest: number; approach?: BijuuApproach; cloakActive: boolean; mantleActive?: boolean };
export type SupplyId = 'antidote' | 'sealing-slate';
export type Inventory = Record<SupplyId, number>;
export type Research = { sealing: number };
export type SageForm = 'stone' | 'storm' | 'veil';
export type PersonalModes = { sageInsight: number; sageActive: boolean; sageForms: SageForm[]; sageForm?: SageForm; gateTraining: number; openGates: 0 | 1 | 2 | 3 };
export type MentorDoctrine = 'guardian' | 'pathfinder' | 'seal-mentor' | 'vanguard-mentor' | 'field-healer';
export type Mentor = { id: string; name: string; doctrine: MentorDoctrine; description: string; bond: number; lessons: number };
export type Origin = { academyMemory: string; latentTag: Tag; description: string };
export type RivalStance = 'competitive' | 'respectful' | 'hostile' | 'allied';
export type Rival = { name: string; style: string; affinity: string; preferredTag: Tag; rank: Rank; reputation: number; rivalry: number; stage: 0 | 1 | 2 | 3 | 4; stance: RivalStance; lastEncounterDay: number; studiedStages: number[]; memory: string };
export type PreparationMethod = 'intel' | 'gear' | 'rest' | 'team' | 'summon' | 'seal' | 'mentor';
export type TraitId = 'neutral' | 'disciplined' | 'instinctive' | 'resilient' | 'precise' | 'fierce' | 'contemplative';
export type Trait = { id: TraitId; name: string; description: string; modifiers: Partial<Record<Attribute, number>> };
export type CareerPath = 'anbu' | 'sensei' | 'commander' | 'rogue';
export type ChuuninExamChoice = 'rescue' | 'secure' | 'analyze';
export type ChuuninExam = { choices: ChuuninExamChoice[]; prompt: string };
export type GeninFieldMark = 'guardian' | 'scout' | 'mediator';
export type RegionalCircuitChoice = 'shield' | 'trace' | 'parley';
export type RegionalCircuit = { prompt: string; host: string; choices: RegionalCircuitChoice[] };
export type FactionId = 'eclipse-covenant' | 'red-hands' | 'hunter-directorate' | 'ashen-lotus';
export type FactionState = { id: FactionId; name: string; agenda: string; standing: number; heat: number };
export type CareerCrisis = { defeatStreak: number; lastSetback?: string; warrant?: string };
export type MissingNinState = { reason: string; wantedLevel: 1 | 2 | 3; huntersAlerted: boolean };
export type WorldState = { season: number; borderTension: number; councilTrust: number; rumors: string[]; secrets: string[]; storyFlags: string[]; factions: FactionState[]; careerCrisis: CareerCrisis; missingNin?: MissingNinState };
export type NarrativeMoment = { npcId: string; prompt: string; choices: ('support' | 'challenge' | 'expose')[] };
export type MissionChoice = 'protect' | 'pursue' | 'negotiate';
export type CombatPlan = 'infiltrate' | 'contain' | 'guard' | 'pressure';
export type CombatApproach = 'probe' | 'commit' | 'protect' | 'feint';
export type CombatEncounter = { plan: CombatPlan; round: number; advantage: number; pressure: number; chakra: number; exposure: number; leadHistory: string[]; supportUsage: Record<string, number>; ocularUsed?: boolean; summonUsed?: boolean; steps: CombatStep[] };
export type MissionOffer = { id: string; rank: MissionRank; title: string; statedRisk: string; hiddenThreat: number; reward: number; objective: string; intel: string; dilemma: string; arcId?: string; factionId?: FactionId; decision?: MissionChoice; plan?: CombatPlan; preparation?: PreparationMethod[] };
export type CombatStep = { round: number; text: string; success: boolean };
export type MissionReport = { outcome: 'success' | 'partial' | 'failure' | 'withdrawn'; rank: MissionRank; decision: MissionChoice; reward: number; reputation: number; injury?: Injury; steps: CombatStep[] };
export type LifetimeStats = { missions: number; successes: number; partials: number; failures: number; trainings: number; relationshipsDeepened: number; ryoEarned: number; daysServed: number; highestMission: MissionRank };
export type Legacy = { ending: 'retired' | 'fallen'; title: string; biography: string; honors: string[]; stats: LifetimeStats };
export type Character = { name: string; village: string; rank: Rank; day: number; attributes: Record<Attribute, number>; trait: Trait; origin: Origin; mentor: Mentor; chakraPool: number; fatigue: number; health: number; ryo: number; inventory: Inventory; research: Research; modes: PersonalModes; reputation: number; notoriety: number; honor: number; factionTrust: { village: number; underworld: number }; relationships: Relationship[]; geninFieldMark?: GeninFieldMark; specialization?: string; careerPath?: CareerPath; bloodline?: string; dojutsuActive: boolean; dojutsuStrain: number; dojutsuStage: number; dojutsuInsight: number; summon?: { id: string; name: string; bond: number; favor: number }; bijuu?: BijuuState; knownJutsu: string[]; loadout: string[]; mastery: Record<string, number>; scars: Scar[]; injury?: Injury };
export type GameState = { saveVersion: 1; seed: number; rngState: number; character: Character; rival: Rival; npcs: Npc[]; team: Team; world: WorldState; regionalCircuit?: RegionalCircuit; chuuninExam?: ChuuninExam; narrative?: NarrativeMoment; stats: LifetimeStats; offer?: MissionOffer; combat?: CombatEncounter; lastReport?: MissionReport; chronicle: ChronicleEntry[]; legacy?: Legacy };
export type Command =
  | { type: 'TRAIN'; attribute: Attribute }
  | { type: 'REST' }
  | { type: 'GRADUATE' }
  | { type: 'PROMOTE' }
  | { type: 'LEARN_JUTSU'; id: string }
  | { type: 'FOCUS_DOJUTSU' }
  | { type: 'CALL_SUMMON' }
  | { type: 'START_REGIONAL_CIRCUIT' }
  | { type: 'RESOLVE_REGIONAL_CIRCUIT'; choice: RegionalCircuitChoice }
  | { type: 'RESOLVE_CHUUNIN_EXAM'; choice: ChuuninExamChoice }
  | { type: 'CHOOSE_CAREER_PATH'; path: CareerPath }
  | { type: 'SEEK_PARDON' }
  | { type: 'SET_LOADOUT'; jutsuIds: string[] }
  | { type: 'CHOOSE_PATH'; kind: 'specialization' | 'bloodline' | 'summon'; id: string }
  | { type: 'FORM_BIJUU_LINK'; id: string }
  | { type: 'CULTIVATE_BIJUU'; approach: BijuuApproach }
  | { type: 'TOGGLE_CLOAK' }
  | { type: 'TOGGLE_MANTLE' }
  | { type: 'TOGGLE_DOJUTSU' }
  | { type: 'CULTIVATE_DOJUTSU' }
  | { type: 'CULTIVATE_SUMMON' }
  | { type: 'MENTOR_LESSON' }
  | { type: 'CONSULT_MENTOR' }
  | { type: 'RIVAL_ENCOUNTER'; approach: 'challenge' | 'study' | 'ally' }
  | { type: 'BUY_SUPPLY'; item: SupplyId }
  | { type: 'RESEARCH'; project: keyof Research }
  | { type: 'CULTIVATE_SAGE' }
  | { type: 'ATTUNE_SAGE_FORM'; form: SageForm }
  | { type: 'TOGGLE_SAGE' }
  | { type: 'TRAIN_GATES' }
  | { type: 'OPEN_GATES'; level: 1 | 2 | 3 }
  | { type: 'BUILD_RELATIONSHIP'; id: Relationship['id'] }
  | { type: 'BUILD_NPC_BOND'; id: string }
  | { type: 'TOGGLE_TEAM_MEMBER'; id: string }
  | { type: 'RESOLVE_NARRATIVE'; choice: 'support' | 'challenge' | 'expose' }
  | { type: 'ADVANCE_SEASON' }
  | { type: 'OFFER_MISSION' }
  | { type: 'PREPARE_SMART' }
  | { type: 'PREPARE'; method: PreparationMethod }
  | { type: 'MISSION_DECISION'; decision: MissionChoice }
  | { type: 'SET_COMBAT_PLAN'; plan: CombatPlan }
  | { type: 'WITHDRAW' }
  | { type: 'RUN_MISSION' }
  | { type: 'RESOLVE_COMBAT_BEAT'; approach: CombatApproach; jutsuId: string }
  | { type: 'END_CAREER' };
