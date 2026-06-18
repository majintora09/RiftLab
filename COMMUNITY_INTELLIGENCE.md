# Community Intelligence Roadmap

Future feature for improving DBFZ Team Lab from Discord discussions.

## Input Sources

- Discord screenshots
- Discord chat logs
- Character discussion threads
- Team-building conversations

## Extraction Goals

The system should detect and extract:

- Character names
- Team compositions
- Synergy discussions
- Strengths and weaknesses
- Matchup opinions
- Repeated community opinions

## Output Shape

Each import should create concise findings per character and per team composition.

Example:

```text
Character:
Janemba

Community Findings:
- Strong neutral assist.
- Frequently paired with Android 18.
- Often recommended for pressure teams.

AI Summary:
Community feedback suggests Janemba is valued primarily for assist utility, pressure support, and conversion potential.
```

## Storage Targets

- Per-character community notes
- Per-team composition findings
- Common partner recommendations
- Common warnings or matchup concerns
- Source references for later review

## Product Goal

Use real community discussion to continuously improve character pages, team recommendations, synergy explanations, and matchup notes.

## Feature Backlog From Community Feedback

### Synergy Tags

Add searchable tags for characters, assists, and team concepts.

Examples:

- long blockstun
- level 1 DHC synergy
- neutral assist
- pressure support
- meter hungry
- strong anchor
- barrier safety
- high-low setup
- conversion assist

Tags should be usable as filters and should also explain why a partner is recommended.

### Character Pages

Build a dedicated character page/view for each fighter.

Each page should include:

- polished summary
- roles and tags
- wants from a team
- best partners
- good partners
- works but needs care
- assist notes
- team examples
- community findings
- frame-data links or imported frame-data summaries

### Dustloop / Frame Data Workflow

Dustloop likely has much of the frame data needed, but the site should not depend on live scraping while users browse.

Recommended workflow:

1. Create a local frame-data schema.
2. Manually export or copy Dustloop tables into CSV/JSON per character.
3. Normalize move names, startup, advantage, invulnerability, and notes.
4. Store imported data in `data/frame-data/`.
5. Show condensed frame-data summaries on character pages.
6. Link back to Dustloop as the source/reference.

Frame data should support tags such as:

- plus on block
- anti-air
- invulnerable
- projectile
- command grab
- low
- overhead
- assist-friendly starter

### Clip-Based Synergy Notes

Allow users to upload clips or Discord references for shells people are testing.

Useful extraction targets:

- which characters are paired
- which assist enables the setup
- what the setup does
- whether the clip proves neutral, pressure, oki, conversion, or damage
- short plain-language takeaway

Example:

```text
Team:
Blueku / Beerus A / Android 18 A

Finding:
Beerus A and Android 18 A support Blueku pressure and conversion routes.

Tags:
pressure, neutral cover, conversion, assist shell
```
