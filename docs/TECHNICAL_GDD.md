# Shinobi Chronicle — Technical GDD (foundation)

## Product promise

A single-player life and career simulation where a day, a relationship, an injury, a secret, and a mission decision can redirect a shinobi's life. The player begins at the Academy; time moves through chosen activities, never arbitrary annual jumps. A completed life is retained as a replayable chronicle and legacy.

**Depth before quantity:** a feature belongs only when it creates decisions, consequences, counters, information asymmetry, or distinct stories. Rank, capability, reputation, and social authority are separate values. There is deliberately no universal power score.

## Current playable career slice

Create a named Academy student; train and recover; graduate to Genin; configure a distinct technique loadout; form relationships with a sensei, rival and teammate; accept, prepare for, or withdraw from missions D through S; simulate a traceable encounter; receive wounds, rewards, reputation, faction consequences and an event chronicle. Genin completes a regional inter-village field circuit—protect, trace, or mediate—to establish a flexible field signature. Promotion to Chuunin then includes a second judgment test (rescue, secure, or analyze), so promotion records what the player prioritized rather than just a threshold. Jounin may earn one irreversible career appointment—ANBU, Sensei, Commander, or missing-nin—with its own crisis operations and legacy. A life can be retired after Chuunin or end in the field, producing a biography, honors and lifetime statistics.

The current content includes Tracker specialization, an activation/strain dōjutsu example, and a named summon contract with a bond gate. Persistent contacts have availability, goals, memories and seasonal independent operations; field teams have membership and cohesion. Every mission requires a stated priority—protect, pursue, or negotiate—with different faction, risk and reward outcomes. Bijū is intentionally a declared interface, not a fake completed system.

The initial world layer records border tension, council trust, rumors, and discovered secrets. These values influence mission pressure and are changed by outcomes. Seasonal NPC story moments resolve through support, challenge, or exposure; the last option requires sufficient investigation capability and can trade a relationship cost for a durable secret and public honor.

## Jinchūriki rules in this build

Kurotsume is an optional sealed Bijū path. It has independent **trust**, **respect**, **control**, **synchronization**, and **unrest**. Cooperation builds trust/synchronization and reduces unrest; suppression creates control while harming trust; domination demands Resolve and trades stability for respect/control. A chakra cloak is gated by control or synchronization, is forcibly spent after a mission, adds field capability and temporary chakra, but adds notoriety and unrest. The second field state, **Resonant Mantle**, requires trust 4, control 6 and synchronization 5: it grants a much larger opening reserve and combat leverage, then adds extra unrest and health cost. Further forms, social discrimination, and bespoke Bijū narrative arcs remain planned content.

Personal transformations are deliberate field commitments, not passive multipliers. Sage has three learned disciplines: **Stone** adds defense/control at low chakra cost, **Storm** adds mobility/perception at medium cost, and **Veil** adds stealth/perception at the highest cost. A character can learn more than one and choose one before a mission. Gates are separately conditioned; the third opening requires maximum current conditioning, health and willpower, then incurs stronger post-mission health loss. Summon contracts can answer once during combat when bond and favor allow it; each contract changes a different pressure, exposure, tracking, or position variable rather than being a generic damage bonus.

## Core domain and invariants

- `Character`: attributes describe capacity; traits/potential describe tendencies and ceilings; jutsu describe actions. Training improves a chosen dimension and advances time; it does not create a separate maintenance meter.
- `Calendar`: every state change advances an explicit number of days. Seasonal advances create deterministic world events; chakra, strain and injury alter specific choices and outcomes without a universal fatigue gauge.
- `Mission`: offer intelligence is imperfect; preparation produces different advantages; withdrawal has a reputation consequence. S-rank access requires a named Jounin appointment and accumulated field results; path-specific crisis operations use different objectives and tactical conditions. A mission is not merely an XP button.
- `Career`: Genin's Circuit Regional uses a real crisis rather than a bracket fight. Its signature improves matching late-career operations but is never a hard build lock; the player can still earn any compatible appointment by meeting the other conditions.
- `Loadout channels`: active base-technique deck grows from 3 Genin slots to 4 Chuunin and 5 Jounin slots. Techniques must first be added to a persistent library through time/ryo-backed study, then may be equipped; their mastery persists while unequipped. Specialization doctrine, dōjutsu, summon contract, Bijuu state, personal mode and logistics are separate channels with their own limits/costs; they never evict a base jutsu slot.
- `Technique tree`: content can declare stable prerequisite technique IDs and an optional specialization requirement. The simulation validates every edge, blocks premature study, and records the time/ryo cost in the chronicle. The first branches demonstrate restraint, sentinel, mobility and sealwright archetypes; additional authored branches remain content work rather than engine rewrites.
- The current pack has 32 techniques across 12 authored branches, 8 specializations and 5 summon contracts. This is deliberately a varied first catalog, not a claim of final content breadth; new branches are additive JSON content under the same validation rules.
- `Dōjutsu`: an active stage-1 eye now has one per-combat focus intervention with a named lineage rule, chakra cost and ocular strain. Kurogane closes enemy routes, Lumen reveals a support opening, and Ashen trades additional pressure for force. This is a real initial technique layer, not a claim that the future full ocular trees are complete.
- `Combat`: the mission's main event is a short, deterministic, player-directed simulation. After choosing an opening plan (infiltrate, contain, guard, or pressure), the player chooses a loaded lead technique plus an intention (probe, commit, protect, or feint) for each of three exchanges. A compatible second equipped technique joins as a chakra-costing continuation; lead techniques cannot repeat consecutively when another slot is available. Tags, mastery, chakra, injury risk, modes and field conditions resolve the trade; the report explains every link in the sequence. Dōjutsu, team preparation and a trusted summon alter rules in explicit ways.
- `Content`: all player-facing definitions live in versioned JSON. Invalid IDs, duplicate IDs, unknown tags, or incompatible costs fail loading.
- `Save`: versioned, serializable state plus seed/RNG state and append-only log. A migration boundary exists even though v1 has no prior migrations.

```
content JSON -> validation -> content registry
                              |
UI action -> command -> simulation reducer -> domain event log -> state/save
                              |                     |
                           seeded RNG <-------- combat explanation
```

## System contracts / roadmap

`BloodlineSystem`, `DojutsuSystem`, `SummonSystem`, and `BijuuSystem` own their rules and return explicit capability hooks to combat/mission, never flat account-wide modifiers. The initial dōjutsu and summon contracts demonstrate this contract but are not exhaustive subsystems. Future Jinchūriki state must model trust, respect, control, synchronization, suppression, and transformation risk. Kekkei Genkai must add/replace rules, not just stats.

The first full Kekkei Genkai content slice supplies Mokuton, Hyōton, Shōton and Yin–Yang Release. Their techniques carry an explicit `bloodline` contract and cannot be learned by another build. Their field hooks only apply when the loadout actually includes their techniques: Mokuton changes territory, containment and protection; Hyōton changes route, pursuit and interception; Shōton changes sight-lines, cover and held positions; Yin–Yang changes stabilization, seals and intent-sensitive choices. This preserves a viable non-bloodline build while preventing a lineage from becoming a generic stat package.

The affinity catalogue now extends that same contract to Sand, Magnet, Lava, Boil, Scorch, Storm, Explosion and Metal Releases, plus Fire, Water, Wind, Earth and Lightning nature trees. Each path has a root, a constrained evolution, and a capstone; each changes a distinct mission variable (routes, cover, vision, equipment, collateral, extraction or reaction time). A player selects one affinity/lineage path per life, but can still build a fully viable universal, specialization, summon or mode-focused shinobi without one.

### Personal operation arcs

The Mission Director reserves high-rank operations for unresolved personal arcs before returning to the ordinary pool. An affinity/lineage starts with a public-cost operation at B, faces a counterplay/mastery operation at A, and earns an S-rank legacy finale. The three eye lineages deliberately do **not** reuse that affinity chain: Kurogane (intent/pattern), Lumen (truth/care), and Ashen (force/restraint) each gate their B → A → S operations on the corresponding dōjutsu stage and insight. Summon, Bijū and Sage paths follow the same B → A → S shape, gated by their actual bond, control/synchronization or learned-form milestones; summon dilemmas are authored per contract identity. An established rival can also unlock an S-rank culmination. An arc only advances on mission success; it writes a `world.storyFlags` checkpoint, a secret, reputation/honor changes and chronicle text. These flags are version-migrated, deterministic and deliberately do not add daily chores. Between operations, nine seeded seasonal outcomes alter concrete world state (tension, rumor, trust, ryo, chakra or social standing), keeping the campaign alive without adding routine screens.

### Career crises, injuries and factions

A mission failure is a branch in a career, not an instant death screen. `world.careerCrisis.defeatStreak` rises on failures/withdrawals, falls only through success, and adds bounded pressure to the next operation after repeated setbacks. Severe failures create injuries with recovery days; there is deliberately no treatment screen, kit, or research shortcut. Time advances naturally through rest and any other time-bearing activity. Once a severity-two injury finishes recovering, it records a **scar** with a contextual condition—committed pressure, ocular use or a transformation—not a universal attribute subtraction. The affected condition makes that kind of operation cost more pressure or chakra, and the biography records both scar and adaptation.

The world starts with four original agenda-bearing factions: **Pacto do Eclipse** seeks rare power; **Mãos Rubras** monetizes unstable borders; **Diretoria de Caçadores** tracks unaligned shinobi; **Lótus Cinzento** protects civilians and dissidents. Their standings and heat are persistent, mission briefings name implicated factions from B rank onward, and results/priority alter their response. A council warrant can arise from an extended, visible collapse; at Chuunin or Jounin it opens a missing-nin choice alongside notoriety and underworld ties. Choosing it creates a wanted level and active hunter pressure, but does not turn the life into an automatic villain route or a separate ending.

Faction standing can reserve a named operation before the ordinary high-rank pool: rare-power characters receive **O Preço do Eclipse**, rogue/underworld characters can face **Contrato sem Bandeira**, and respected protectors can receive **Abrigo de Lótus**. These are decisions about ownership, civilian dependence and sanctuary, not loyalty meters to fill. A missing-nin receives **Dossiê de Cinzas** first, then the A-rank **Nome diante do Conselho**. Only after succeeding in that reckoning, while holding minimal council trust and honor, can the player seek a pardon. Pardon ends the hunt and changes the eventual legacy, but leaves the prior choices in the chronicle and requires the character to earn a later village appointment normally.

The three non-hunter contracts continue at A rank instead of ending at a single favorable score: **O Arquivo que Respira** decides whether rare-power identities become property, evidence or a distributed responsibility; **A Dívida da Ponte** weighs a legal victory against the people kept alive by an illicit passage; **Cinzas do Refúgio** turns sanctuary into an evacuation under pressure. Their protect/pursue/negotiate priorities write a durable branch flag and alter a specific combination of council trust, honor, notoriety, underground ties and faction heat. Thus a faction is remembered for the concrete way the shinobi handled it, not only for a positive or negative standing value.

### Seeded origin and mentor

Each life receives a bounded Academy-origin memory and a named mentor from the same deterministic seed as starting aptitudes and trait. Origins are non-family background color with a latent tactical tag; they never invalidate a build or grant a hidden power score. Mentors use one of five doctrines—guardian, pathfinder, seal mentor, vanguard, or field healer—and remain the existing sensei relationship rather than becoming a separate NPC-management system. Up to three bond-gated lessons grant one named development attribute each and unlock an optional mission consultation. Consultation affects a specific plan/priority variable for that operation and is consumed by that mission; it is neither a daily chore nor a universal bonus.

| Mentor doctrine | Three lesson developments | Mission counsel |
| --- | --- | --- |
| Guardian (Sena) | Stamina → Willpower → Chakra Control | Reduces pressure; strongest protecting/containing. |
| Pathfinder (Rei) | Speed → Intelligence → Hand Seals | Finds alternate routes; strongest infiltrating. |
| Seal mentor (Kaito) | Hand Seals → Chakra Control → Intelligence | Identifies a condition sustaining a trap; strongest containing. |
| Vanguard (Nari) | Taijutsu → Strength → Speed | Identifies a committed opening; strongest pressing, with added pressure. |
| Field healer (Aya) | Chakra Control → Intelligence → Willpower | Establishes triage and extraction priority; strongest protecting. |

### Persistent rival

The rival is a seeded, career-parallel shinobi rather than a generic relationship entry. Each life generates an original name with shinobi/Japanese-inspired phonetics, then gives that rival one build identity (wind pressure, seal counterplay, ice reading, metal guard, or mirage escape), an affinity label and a tactical tag they prefer. Their rank/stage tracks the protagonist's career while reputation and rivalry evolve separately. Between operations, the player may challenge them (a deterministic build-read contest), study their counterpoint (one attribute development per career stage), or earn an uneasy alliance after reducing hostility. The challenge never ends the protagonist's life or replaces the main career loop; it creates an explicit mirror, chronicle memory and alternate developmental path.

Planned modules: NPC daily schedules and relationship memories; village/faction diplomatic graph; authored/procedural Narrative Director; E–S objective generators with intelligence layers; economy/logistics/crafting; research and technique authoring; career appointments; legacy/Hall of Legends. Each must consume domain events rather than reach into UI state.

## Content shape

`content/core.json` is the first pack. Packs identify `schemaVersion`, and are loaded through `validateContent`. Portrait and art fields are optional `assetSlot` strings; UI displays a graceful monogram placeholder until the user supplies an asset. Mods should add packs and references, never edit saves directly.
