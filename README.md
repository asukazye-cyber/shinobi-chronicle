# Shinobi Chronicle

Single-player, text-first career simulation. See `docs/` for the design and architecture. Run `npm install`, then `npm run dev`.

## Pacotes de conteúdo

Em **Abrir arsenal e mundo → Escolhas de build → Conteúdo adicional**, importe um arquivo JSON. O jogo aceita apenas dados com `schemaVersion: 1`; o pacote não executa código e é validado antes de aparecer na biblioteca.

```json
{
  "id": "meu-pacote",
  "schemaVersion": 1,
  "jutsu": [{
    "id": "sino-silencioso",
    "name": "Sino Silencioso",
    "tags": ["perception", "stealth"],
    "chakraCost": 4,
    "mastery": 0,
    "description": "Uma vibração discreta revela movimento por trás de paredes."
  }]
}
```

Também são aceitas listas de `specializations`, `bloodlines`, `dojutsu`, `summons` e `bijuu`. IDs precisam ser únicos em relação ao jogo e aos demais pacotes ativos. Os pacotes ficam guardados apenas neste navegador.
