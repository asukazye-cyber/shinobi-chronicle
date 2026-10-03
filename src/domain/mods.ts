import type { Content } from './types';

/**
 * A portable data-only mod contract. The web client does not execute mod code:
 * a pack may add content, but cannot alter simulation code or saves.
 */
export type ContentPack = {
  id: string;
  schemaVersion: 1;
  jutsu?: Content['jutsu'];
  specializations?: Content['specializations'];
  bloodlines?: Content['bloodlines'];
  dojutsu?: Content['dojutsu'];
  summons?: Content['summons'];
  bijuu?: Content['bijuu'];
};

function appendUnique<T extends { id: string }>(base: T[], additions: T[] | undefined, label: string, packId: string): T[] {
  if (!additions?.length) return base;
  const ids = new Set(base.map(item => item.id));
  for (const item of additions) {
    if (ids.has(item.id)) throw new Error(`Mod ${packId} conflicts with existing ${label} id: ${item.id}`);
    ids.add(item.id);
  }
  return [...base, ...additions];
}

export function mergeContentPacks(base: Content, packs: ContentPack[]): Content {
  let merged: Content = structuredClone(base);
  const packIds = new Set<string>();
  for (const pack of packs) {
    if (!pack.id || packIds.has(pack.id)) throw new Error(`Duplicate or missing mod pack id: ${pack.id || '(missing)'}`);
    if (pack.schemaVersion !== base.schemaVersion) throw new Error(`Mod ${pack.id} targets schema ${pack.schemaVersion}; game requires ${base.schemaVersion}.`);
    packIds.add(pack.id);
    merged = {
      ...merged,
      jutsu: appendUnique(merged.jutsu, pack.jutsu, 'jutsu', pack.id),
      specializations: appendUnique(merged.specializations, pack.specializations, 'specialization', pack.id),
      bloodlines: appendUnique(merged.bloodlines, pack.bloodlines, 'bloodline', pack.id),
      dojutsu: appendUnique(merged.dojutsu, pack.dojutsu, 'dōjutsu', pack.id),
      summons: appendUnique(merged.summons, pack.summons, 'summon', pack.id),
      bijuu: appendUnique(merged.bijuu, pack.bijuu, 'bijū', pack.id)
    };
  }
  return merged;
}
