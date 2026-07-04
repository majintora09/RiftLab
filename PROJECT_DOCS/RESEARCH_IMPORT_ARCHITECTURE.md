# FG Lab Research Import Architecture

FG Lab uses one reusable research layout for every fighting game:

```text
data/games/<game>/
  characters/
  synergies/
  routes/
  matchups/
  research/
    videos/sources.json
    transcripts/
    imports/import_queue.json
    observations/observations.json
    observations/verified_observations.json
    observations/meta_notes.json
```

Raw transcripts are stored in `research/transcripts/` and are never edited. Source metadata lives in `research/videos/sources.json`. The import queue tracks pending transcript work by game, transcript, and status.

The workflow is:

```text
Transcript -> Import Queue -> Observation Extraction -> Review -> Verified Database -> Website
```

Extracted findings are observations. They never directly modify character files, synergy files, routes, or matchups. Unknown conclusions stay `Research In Progress` until reviewed.

Verified information is append-only. If an incoming observation conflicts with verified data, the pipeline writes a research note to `meta_notes.json` and does not overwrite the verified record.

Common commands:

```bash
npm run research:init
node scripts/fg-research.js enqueue --game 2xko --transcript guide.txt --title "Guide Title" --youtube https://youtube.com/watch?v=...
npm run research:process -- --game 2xko
node scripts/fg-research.js verify --game 2xko --observation observation-id
```

Adding a new video should only require:

1. Paste the transcript into `data/games/<game>/research/transcripts/`.
2. Add or enqueue source metadata.
3. Leave queue status as `pending`.

The import pipeline handles extraction into reviewable observations.
