# Content Guidelines

Use this file as the quick reference for content cleanup, imported transcript cleanup, and future editor validation.

Current priority: Content Formatting + Editor UX.

Focus:
- Fix imported DBFZ content formatting.
- Clean tags.
- Improve grouped filters.
- Rename Network to Knowledge Map.
- Improve Movie Room structure.
- Begin admin inline editing.

Phase 1 implemented:
- DHC notes render through the shared structured format when source data exists.
- Assist notes render through the shared structured format when source data exists.
- Tags are normalized before they become chips or filters.
- Tags must remain chips only; explanatory text belongs in note sections.

Phase 2 implemented:
- Tag filters use grouped categories instead of a giant flat tag dropdown.
- Public navigation uses `Knowledge Map` instead of `Network`.
- Knowledge Map fallback copy should explain the connection or what data is missing.

## Tags
Good:
- Pressure
- Mix
- Battery
- Grappler
- Beam
- Lockdown
- Neutral
- Setplay
- Meter Build

Bad:
- Characters looking to continue pressure.
- Allows teams to convert neutral wins into stronger rewards.
- Characters that love DHCing into this character.
- Needs assists to cover weak neutral and extend pressure.

Rules:
- Tags should be short concepts.
- Tags should be reusable across multiple characters, assists, teams, and playstyles.
- Tags should work as filters.
- Long explanations belong in notes, not tags.
- Runtime cleanup removes trailing periods, duplicate tags, full sentence tags, comma-heavy fragments, and obvious imported PDF fragments.
- If cleanup removes a phrase, preserve the meaning in `Why`, `Provides`, `Best For`, DHC notes, or regular description text instead of forcing it back into tags.

## DHC Notes Format
Use this structure for character pages, Training Lab sections, and editor forms:

- Who likes DHCing into this:
- Why:
- Who this character likes DHCing into:
- Why:
- Special interactions:

Rules:
- Keep each section short.
- Use bullets when there are multiple examples.
- Explain the practical team-building reason.
- Avoid repeating the character name every sentence.
- Do not paste raw transcript paragraphs.
- Do not put these section headings or their full sentences into tags.

## Assist Format
Use this structure for assist notes and editor forms:

- Provides:
- Best For:
- Why:
- Tags:

Rules:
- `Provides` should explain the assist function.
- `Best For` should identify the team need or archetype.
- `Why` should explain the practical reason.
- `Tags` should stay short and filterable.
- Do not mix assist tags into paragraph copy.
- Do not turn full assist explanations into tags.

## Grouped Filters

Filters should be grouped by purpose:

- Position: Point, Mid, Anchor.
- Playstyle: Rushdown, Neutral, Mix, Setplay, Zoner, Grappler, Defensive, Technical.
- Team Role: Battery, Support, Enabler, Finisher, Anchor, Glue, Generalist, Specialist.
- Assist Type: Beam Assist, Lockdown Assist, Tracking Assist, DP Assist, Combo Extension, Pressure Assist.
- Team Needs: Meter Build, Corner Carry, Reliable Confirms, Neutral Control, Easy Gameplan, High Damage, Beginner Friendly.
- Content Status: Polished, Needs Cleanup, Missing Data.

Rules:
- Filters should combine cleanly.
- Avoid dumping every tag at once.
- Prefer collapsible groups when there are many options.
- Filter labels should be short and readable.
- Grouped filters should use curated concepts first, not every raw imported tag.
- Keep values compatible with normalized tag matching so `Beam Assist` can still find content tagged `Beam`.

## Knowledge Map Naming

Use `Knowledge Map` as the public label.

Avoid:
- Network.

Rules:
- Knowledge Map connections should explain why two things are related.
- Avoid generic copy like "X is connected to Y through character data."

## Movie Room Structure

Movie Room should support:

- Character study.
- Shell study.
- Team study.

Rules:
- Use compact selectors.
- Reuse current Team Builder selections where possible.
- Avoid showing a full roster inside Movie Room unless the user explicitly chooses to change characters.
- Show small portraits/names for selected characters.

## Admin Inline Editing

Inline editing should eventually support:

- Tags.
- Ratings.
- Descriptions.
- Archetypes.
- Partners.
- Assist notes.
- DHC notes.
- Training Lab content.
- Movie Room links.

Rules:
- Keep Admin hidden until auth/roles exist.
- Use forms, not raw JSON editing.
- Add validation hints based on these guidelines.
- Contributors should suggest; Editors/Admins should publish.

Keep descriptions short, structured and easy to scan.
