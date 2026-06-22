# Task Request

Status:
Completed on 2026-06-22.

## Objective

Generate the modular 2XKO Synergy Database for every unique two-character combination in the 15-character intelligence registry.

## Scope

- Add a dependency-free synergy generator driven by `intelligenceFiles` in `data/games.js`.
- Generate 105 unique unordered team files under `data/games/2xko/synergies`.
- Use alphabetically normalized slugs for stable filenames.
- Create a deterministic index manifest.
- Preserve existing pair files unless an explicit overwrite flag is used.
- Add browser helpers to resolve, list, and load pair records.
- Run the generator automatically before static builds.

## Out Of Scope

- No invented ratings, difficulty, matchup conclusions, Fuses, routes, or notes.
- No wiki, move-list, frame-data, or command content.
- No new public synergy interface.
- No automatic verification.

## Success Criteria

- Exactly 105 pair files exist for the 15-character roster.
- Every pair uses the requested schema and has `rating: null`, `difficulty: null`, `verified: false`.
- Every pair supports multiple sources through an array.
- Reversed character order resolves to the same canonical filename.
- Future Team Builder code can load one pair or all pairs for a character.
- `npm run build` regenerates missing files and ships the complete database.

## Notes

Normal generation preserves researched files. `--overwrite` is reserved for intentionally resetting placeholders.
