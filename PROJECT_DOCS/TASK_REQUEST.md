# Task Request

Status:
Completed on 2026-06-22.

## Objective

Create a lightweight local Research Import Workflow that turns source observations into reviewed synergy evidence.

## Scope

- Extend Research Entries with source, timestamp, character, partner, Fuse, tags, notes, and confidence.
- Add a fast local Quick Add form.
- Add search and combined source, stage, confidence, and tag filters.
- Add Draft -> Needs Review -> Approved controls.
- Export the complete vault as JSON.
- Export approved character-pair evidence into the existing synergy-file schema.

## Out Of Scope

- No AI APIs or generated gameplay conclusions.
- No external services, database, authentication system, or production server.
- No automatic overwrite of repository synergy files from the browser.
- No public navigation link for the internal Research Vault.

## Success Criteria

- Entries persist locally as JSON in browser storage and can be exported.
- Existing v1 local entries migrate into the new normalized schema.
- Review stage changes persist locally.
- Only approved entries with both characters can be exported as synergy evidence.
- Pair exports keep ratings and difficulty null and `verified: false`.
- Search and filters work across the new fields.
- The Vault remains responsive and absent from public 2XKO navigation.

## Notes

The browser cannot safely write into the repository. Synergy exports are downloaded for deliberate human review before replacing or merging files under `data/games/2xko/synergies`.
