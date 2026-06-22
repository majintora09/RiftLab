# Task Request

Status:
Completed on 2026-06-22.

## Objective

Complete the initial decision-first 2XKO character intelligence structure for all 15 champions supplied in the current roster list.

## Scope

- Preserve the existing shared Noa-style schema.
- Add Akali, Blitzcrank, Caitlyn, Teemo, Vi, and Warwick records.
- Keep the existing Ahri, Braum, Darius, Ekko, Illaoi, Jinx, Senna, Thresh, and Yasuo records unchanged in shape.
- Update the shared 2XKO intelligence file registry.
- Keep every unverified gameplay conclusion TODO-marked.
- Confirm all 15 records ship in the static build.

## Out Of Scope

- No move lists, commands, frame data, controls, or wiki sections.
- No speculative partners, Fuses, routes, matchup claims, or community tech.
- No public character interface changes.

## Success Criteria

- All 15 requested JSON files exist under `data/games/2xko`.
- Every file has identical keys and value types.
- No prohibited wiki-style fields exist.
- The game config lists all 15 file IDs.
- `npm run build` copies all records into `dist`.

## Notes

Research Vault verification remains the gate for replacing TODO values.
