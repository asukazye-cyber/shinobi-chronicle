import type { Content, Tag } from './types';
const tags = new Set<Tag>(['offense', 'defense', 'control', 'mobility', 'perception', 'support', 'stealth']);
export function validateContent(raw: unknown): Content {
  const c = raw as Content;
  if (!c || c.schemaVersion !== 1 || !Array.isArray(c.jutsu)) throw new Error('Content must declare schemaVersion 1 and jutsu.');
  const ids = new Set<string>();
  for (const j of c.jutsu) {
    if (!j.id || ids.has(j.id) || !j.name || j.chakraCost < 0 || !j.tags?.length || j.tags.some(t => !tags.has(t))) throw new Error(`Invalid jutsu: ${j.id ?? 'unknown'}`);
    ids.add(j.id);
  }
  for (const j of c.jutsu) for (const prerequisite of j.requires ?? []) if (!ids.has(prerequisite) || prerequisite === j.id) throw new Error(`Invalid jutsu prerequisites: ${j.id}`);
  for (const list of [c.specializations, c.bloodlines, c.dojutsu, c.summons, c.bijuu]) for (const item of list ?? []) if (!item.id || !item.name) throw new Error('Content item missing stable id or name.');
  const specializations = new Set((c.specializations ?? []).map(item => item.id));
  for (const j of c.jutsu) if (j.specialization && !specializations.has(j.specialization)) throw new Error(`Invalid jutsu specialization: ${j.id}`);
  const bloodlines = new Set([...(c.bloodlines ?? []), ...(c.dojutsu ?? [])].map(item => item.id));
  for (const j of c.jutsu) if (j.bloodline && !bloodlines.has(j.bloodline)) throw new Error(`Invalid jutsu bloodline: ${j.id}`);
  return c;
}
