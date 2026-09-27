# Architecture and interaction map

## Layers

1. **Content** (`src/data`): versioned definitions, no runtime state.
2. **Domain** (`src/domain`): types and validators shared by UI, engine, tools, and tests.
3. **Engine** (`src/engine`): deterministic RNG, command reducer, combat resolution, save codec, append-only chronicle.
4. **UI** (`src/App.tsx`): renders state and dispatches commands. It makes no random decisions.

```
Player choice -> Command -> advanceDays / resolveMission
                         -> DomainEvent[] -> Chronicle
                         -> GameState -> local save export/import (next milestone)
```

`GameState.npcs` is authoritative for persistent contact status, goals and memories. `GameState.team` stores deliberate field membership and cohesion. A mission offer carries the player-selected priority, so replay explains why the same scene resolves differently; no outcome is inferred from UI state alone.

## Determinism and replay

The Mulberry32 state is stored with the game. Every random draw updates state and a mission report records its meaning. Replaying identical initial state + command sequence produces identical result. Tests assert this.

## Extension rules

- Commands are the only mutation path.
- Cross-system effects are events/capability hooks, not UI conditionals.
- IDs are stable strings; save data stores IDs rather than duplicated definitions.
- New save versions require a pure migration from prior versions and a test fixture.
- Content validation happens before a game can begin; gameplay never accepts unknown content IDs.

## Asset convention

Definitions may contain `assetSlot` such as `portraits/academy-rival`. It is a reference, not a required bundled file. The UI must fall back to text/monogram.
