const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gamesRoot = path.join(root, "data", "games");
const defaultGames = ["dbfz", "2xko", "guilty-gear", "street-fighter", "tekken"];
const observationTypes = ["Synergy", "Route", "Matchup", "Fuse", "Tech", "Neutral", "Pressure", "Combo", "Defense"];
const queueStatuses = ["pending", "processing", "processed", "failed"];

const command = process.argv[2] || "help";
const options = parseOptions(process.argv.slice(3));

try {
  if (command === "init") initCommand();
  else if (command === "enqueue") enqueueCommand();
  else if (command === "process") processCommand();
  else if (command === "verify") verifyCommand();
  else help();
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
}

function initCommand() {
  const games = listRequestedGames();
  ensureDir(gamesRoot);
  writeJsonIfMissing(path.join(gamesRoot, "index.json"), {
    schemaVersion: 1,
    games: games.map((id) => ({ id, title: titleCase(id), status: "research-ready" })),
  });
  for (const game of games) initGame(game);
  console.log(`Research architecture initialized for ${games.length} game(s): ${games.join(", ")}`);
}

function enqueueCommand() {
  const game = requireOption("game");
  const transcript = requireOption("transcript");
  initGame(game);
  const gameRoot = gamePath(game);
  const queuePath = researchFile(gameRoot, "imports", "import_queue.json");
  const sourcePath = researchFile(gameRoot, "videos", "sources.json");
  const queue = readJson(queuePath, emptyQueue(game));
  const sources = readJson(sourcePath, emptySources(game));
  const sourceId = options.source || slugify(options.title || transcript.replace(/\.[^.]+$/, ""));
  const now = today();
  if (!sources.sources.some((source) => source.id === sourceId)) {
    sources.sources.push({
      id: sourceId,
      game,
      title: options.title || titleCase(sourceId),
      creator: options.creator || "",
      youtube_link: options.youtube || "",
      transcript_file: transcript,
      topics: splitList(options.topics),
      date_added: now,
      status: "pending",
    });
  }
  if (!queue.queue.some((entry) => entry.game === game && entry.transcript === transcript)) {
    queue.queue.push({
      id: `${game}-${sourceId}`,
      game,
      source_id: sourceId,
      transcript,
      status: "pending",
      created_at: now,
      updated_at: now,
      error: "",
    });
  }
  writeJson(sourcePath, sources);
  writeJson(queuePath, queue);
  console.log(`Queued ${transcript} for ${game}.`);
}

function processCommand() {
  const games = options.game ? [options.game] : discoverGames();
  let processed = 0;
  for (const game of games) processed += processGame(game);
  console.log(`Processed ${processed} pending import(s).`);
}

function verifyCommand() {
  const game = requireOption("game");
  const observationId = requireOption("observation");
  const gameRoot = gamePath(game);
  const observationPath = researchFile(gameRoot, "observations", "observations.json");
  const verifiedPath = researchFile(gameRoot, "observations", "verified_observations.json");
  const metaPath = researchFile(gameRoot, "observations", "meta_notes.json");
  const observations = readJson(observationPath, emptyObservations(game));
  const verified = readJson(verifiedPath, emptyVerified(game));
  const meta = readJson(metaPath, emptyMetaNotes(game));
  const observation = observations.observations.find((item) => item.id === observationId);
  if (!observation) throw new Error(`Observation not found: ${observationId}`);
  const conflict = findConflict(observation, verified.verified_observations);
  if (conflict) {
    meta.notes.push(conflictNote(game, observation, conflict));
    writeJson(metaPath, meta);
    throw new Error(`Conflict found with verified observation ${conflict.id}. Meta note created; verified data was not overwritten.`);
  }
  if (!verified.verified_observations.some((item) => item.id === observation.id)) {
    verified.verified_observations.push({ ...observation, review_status: "verified", verified_at: today() });
  }
  observation.review_status = "verified";
  observation.updated_at = today();
  writeJson(observationPath, observations);
  writeJson(verifiedPath, verified);
  console.log(`Verified ${observationId} for ${game}.`);
}

function initGame(game) {
  const gameRoot = gamePath(game);
  const folders = [
    "characters",
    "synergies",
    "routes",
    "matchups",
    "research",
    path.join("research", "videos"),
    path.join("research", "transcripts"),
    path.join("research", "observations"),
    path.join("research", "imports"),
  ];
  folders.forEach((folder) => ensureDir(path.join(gameRoot, folder)));
  writeJsonIfMissing(path.join(gameRoot, "game.json"), {
    schemaVersion: 1,
    id: game,
    title: titleCase(game),
    status: "Research In Progress",
    architecture: "fg-lab-research-v1",
  });
  ensureCharacterIndex(gameRoot, game);
  writeJsonIfMissing(path.join(gameRoot, "synergies", "index.json"), emptyCollection(game, "synergies"));
  writeJsonIfMissing(path.join(gameRoot, "routes", "index.json"), emptyCollection(game, "routes"));
  writeJsonIfMissing(path.join(gameRoot, "matchups", "index.json"), emptyCollection(game, "matchups"));
  writeJsonIfMissing(researchFile(gameRoot, "videos", "sources.json"), emptySources(game));
  writeJsonIfMissing(researchFile(gameRoot, "imports", "import_queue.json"), emptyQueue(game));
  writeJsonIfMissing(researchFile(gameRoot, "observations", "observations.json"), emptyObservations(game));
  writeJsonIfMissing(researchFile(gameRoot, "observations", "verified_observations.json"), emptyVerified(game));
  writeJsonIfMissing(researchFile(gameRoot, "observations", "meta_notes.json"), emptyMetaNotes(game));
  writeTextIfMissing(path.join(gameRoot, "research", "transcripts", ".gitkeep"), "");
}

function processGame(game) {
  initGame(game);
  const gameRoot = gamePath(game);
  const queuePath = researchFile(gameRoot, "imports", "import_queue.json");
  const sourcePath = researchFile(gameRoot, "videos", "sources.json");
  const observationPath = researchFile(gameRoot, "observations", "observations.json");
  const verifiedPath = researchFile(gameRoot, "observations", "verified_observations.json");
  const metaPath = researchFile(gameRoot, "observations", "meta_notes.json");
  const queue = readJson(queuePath, emptyQueue(game));
  const sources = readJson(sourcePath, emptySources(game));
  const observations = readJson(observationPath, emptyObservations(game));
  const verified = readJson(verifiedPath, emptyVerified(game));
  const meta = readJson(metaPath, emptyMetaNotes(game));
  const characterRegistry = loadCharacters(gameRoot);
  let processed = 0;
  for (const entry of queue.queue.filter((item) => item.status === "pending")) {
    entry.status = "processing";
    entry.updated_at = today();
    try {
      const transcriptPath = path.join(gameRoot, "research", "transcripts", entry.transcript);
      const transcript = fs.readFileSync(transcriptPath, "utf8");
      const source = sources.sources.find((item) => item.id === entry.source_id || item.transcript_file === entry.transcript) || {};
      const extracted = extractObservations({ game, transcript, entry, source, characterRegistry });
      for (const observation of extracted) {
        const conflict = findConflict(observation, verified.verified_observations);
        if (conflict) meta.notes.push(conflictNote(game, observation, conflict));
        const existingIndex = observations.observations.findIndex((item) => item.id === observation.id);
        if (existingIndex >= 0) observations.observations[existingIndex] = observation;
        else if (!observations.observations.some((item) => observationKey(item) === observationKey(observation))) {
          observations.observations.push(observation);
        }
      }
      entry.status = "processed";
      entry.error = "";
      if (source.id) source.status = "processed";
      processed += 1;
    } catch (error) {
      entry.status = "failed";
      entry.error = error.message || String(error);
    } finally {
      entry.updated_at = today();
    }
  }
  writeJson(queuePath, queue);
  writeJson(sourcePath, sources);
  writeJson(observationPath, observations);
  writeJson(metaPath, meta);
  return processed;
}

function extractObservations({ game, transcript, entry, source, characterRegistry }) {
  const chunks = transcript
    .split(/\n{2,}|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length >= 24);
  const observations = [];
  let activeCharacters = [];
  chunks.forEach((chunk, index) => {
    const type = detectType(chunk);
    const timestamp = extractTimestamp(chunk);
    const characters = detectCharacters(chunk, characterRegistry);
    const headingCharacters = detectHeadingCharacters(chunk, characterRegistry);
    if (headingCharacters.length) activeCharacters = headingCharacters;
    else if (characters.length) activeCharacters = characters;
    const relatedCharacters = characters.length ? characters : activeCharacters;
    observations.push({
      id: `${game}-${slugify(entry.source_id || entry.transcript)}-${String(index + 1).padStart(3, "0")}`,
      game,
      source: source.id || entry.source_id || entry.transcript,
      source_title: source.title || "",
      source_link: source.youtube_link || "",
      transcript: entry.transcript,
      timestamp,
      characters: relatedCharacters,
      team: detectTeam(chunk, relatedCharacters),
      type,
      observation: cleanObservation(chunk),
      possible_conclusion: "Research In Progress",
      confidence: "Low",
      review_status: "needs-review",
      created_at: today(),
      updated_at: today(),
    });
  });
  return observations;
}

function detectType(text) {
  const value = text.toLowerCase();
  const matchers = [
    ["Fuse", /\bfuse\b|\bdouble down\b|\bfreestyle\b|\bfury\b/],
    ["Route", /\broute\b|\boki\b|\bcorner carry\b|\btag route\b/],
    ["Matchup", /\bmatchup\b|\bversus\b|\bvs\b|\bcounter\b/],
    ["Synergy", /\bsynergy\b|\bassist\b|\bpartner\b|\bteam\b|\bduo\b/],
    ["Combo", /\bcombo\b|\bconfirm\b|\blauncher\b|\bextension\b/],
    ["Pressure", /\bpressure\b|\blockdown\b|\bstrike\b|\bthrow\b|\bmix\b/],
    ["Defense", /\bdefense\b|\bblock\b|\bguard\b|\bescape\b|\breversal\b/],
    ["Neutral", /\bneutral\b|\bspace\b|\bpoke\b|\bfootsies\b|\bapproach\b/],
    ["Tech", /\btech\b|\bsetup\b|\boption select\b|\bOS\b/i],
  ];
  return matchers.find(([, pattern]) => pattern.test(value))?.[0] || "Tech";
}

function extractTimestamp(text) {
  return text.match(/\b(?:(?:\d{1,2}:)?\d{1,2}:)?\d{1,2}:\d{2}\b/)?.[0] || "";
}

function detectCharacters(text, registry) {
  const value = text.toLowerCase();
  return registry
    .filter((character) => {
      const aliases = characterAliases(character).filter((alias) => alias.length > 3);
      const idMatchAllowed = character.id.length > 3;
      return aliases.some((alias) => value.includes(alias))
        || (idMatchAllowed && new RegExp(`(^|[^a-z0-9])${escapeRegExp(character.id)}([^a-z0-9]|$)`).test(value));
    })
    .map((character) => character.id);
}

function detectHeadingCharacters(text, registry) {
  const heading = String(text || "").split(/\n|\./)[0].trim().toLowerCase();
  if (!heading || heading.length > 72) return [];
  return registry
    .filter((character) => characterAliases(character).some((alias) => heading === alias || heading.startsWith(`${alias} `)))
    .map((character) => character.id);
}

function characterAliases(character) {
  const base = [character.id, character.name || ""];
  const expanded = [];
  for (const item of base) {
    const normalized = String(item || "").toLowerCase().replace(/[_-]+/g, " ").trim();
    if (!normalized) continue;
    expanded.push(normalized);
    expanded.push(normalized.replace(/\bssj\b/g, "super saiyan"));
    expanded.push(normalized.replace(/\bssj4\b/g, "super saiyan 4"));
    expanded.push(normalized.replace(/\bdbs\b/g, "super").replace(/\bdbz\b/g, "z"));
    expanded.push(normalized.replace(/\badult gohan\b/g, "a gohan"));
    expanded.push(normalized.replace(/\bteen gohan\b/g, "team gohan"));
    expanded.push(normalized.replace(/\bfrieza\b/g, "freeza"));
    expanded.push(normalized.replace(/\bandroid\b/g, "a"));
  }
  return [...new Set(expanded.filter(Boolean))];
}

function detectTeam(text, characters) {
  if (characters.length <= 1) return characters;
  const value = text.toLowerCase();
  if (value.includes("+") || value.includes(" team ") || value.includes(" duo ") || value.includes(" assist ")) return characters.slice(0, 3);
  return [];
}

function cleanObservation(text) {
  return text.replace(/\s+/g, " ").replace(/^\[[^\]]+\]\s*/, "").slice(0, 600);
}

function findConflict(candidate, verified) {
  return verified.find((item) => {
    const sameType = item.type === candidate.type;
    const sameCharacters = arrayKey(item.characters) === arrayKey(candidate.characters);
    const bothConclusive = item.possible_conclusion && candidate.possible_conclusion && item.possible_conclusion !== candidate.possible_conclusion;
    return sameType && sameCharacters && bothConclusive;
  });
}

function conflictNote(game, candidate, verified) {
  return {
    id: `${game}-conflict-${Date.now()}`,
    game,
    type: "conflict",
    status: "open",
    summary: "Incoming observation conflicts with verified information. Verified data was not overwritten.",
    incoming_observation: candidate.id,
    verified_observation: verified.id,
    created_at: today(),
  };
}

function loadCharacters(gameRoot) {
  const indexPath = path.join(gameRoot, "characters", "index.json");
  const index = readJson(indexPath, { characters: [] });
  const indexed = (index.characters || index.items || []).map((item) => ({ id: item.id, name: item.name || titleCase(item.id) }));
  if (indexed.length) return indexed;
  return fs.readdirSync(gameRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !["game.json"].includes(entry.name))
    .map((entry) => ({ id: entry.name.replace(/\.json$/, ""), name: titleCase(entry.name.replace(/\.json$/, "")) }));
}

function characterIndex(gameRoot, game) {
  const publicIndex = publicCharacterIndex(game);
  if (publicIndex.length) return { schemaVersion: 1, game, characters: publicIndex };
  const legacyCharacters = fs.existsSync(gameRoot)
    ? fs.readdirSync(gameRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !["game.json"].includes(entry.name))
      .map((entry) => ({
        id: entry.name.replace(/\.json$/, ""),
        name: titleCase(entry.name.replace(/\.json$/, "")),
        file: `../${entry.name}`,
        status: "legacy-reference",
      }))
    : [];
  return { schemaVersion: 1, game, characters: legacyCharacters };
}

function ensureCharacterIndex(gameRoot, game) {
  const indexPath = path.join(gameRoot, "characters", "index.json");
  const next = characterIndex(gameRoot, game);
  if (!fs.existsSync(indexPath)) {
    writeJson(indexPath, next);
    return;
  }
  const current = readJson(indexPath, { characters: [] });
  if (!Array.isArray(current.characters) || current.characters.length === 0) writeJson(indexPath, next);
}

function publicCharacterIndex(game) {
  const file = path.join(root, "public", "data", game, "characters.json");
  if (!fs.existsSync(file)) return [];
  const data = readJson(file, { characters: [] });
  return (data.characters || []).map((character) => ({
    id: character.id,
    name: character.name || titleCase(character.id),
    file: character.frameDataPath || "",
    source: character.source || data.source || "public-data",
    sourceUrl: character.sourceUrl || "",
    status: "public-reference",
  })).filter((character) => character.id);
}

function listRequestedGames() {
  return splitList(options.games).length ? splitList(options.games) : [...new Set([...discoverGames(), ...defaultGames])];
}

function discoverGames() {
  if (!fs.existsSync(gamesRoot)) return defaultGames;
  return fs.readdirSync(gamesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function researchFile(gameRoot, folder, file) {
  return path.join(gameRoot, "research", folder, file);
}

function gamePath(game) {
  return path.join(gamesRoot, slugify(game));
}

function emptySources(game) {
  return { schemaVersion: 1, game, sources: [] };
}

function emptyQueue(game) {
  return { schemaVersion: 1, game, statuses: queueStatuses, queue: [] };
}

function emptyObservations(game) {
  return { schemaVersion: 1, game, observation_types: observationTypes, observations: [] };
}

function emptyVerified(game) {
  return { schemaVersion: 1, game, verified_observations: [] };
}

function emptyMetaNotes(game) {
  return { schemaVersion: 1, game, notes: [] };
}

function emptyCollection(game, key) {
  return { schemaVersion: 1, game, [key]: [], update_rule: "Verified information is append-only. Conflicts create research meta notes." };
}

function parseOptions(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = args[index + 1];
    parsed[key] = next && !next.startsWith("--") ? next : true;
    if (parsed[key] === next) index += 1;
  }
  return parsed;
}

function requireOption(key) {
  if (!options[key]) throw new Error(`Missing --${key}`);
  return String(options[key]);
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJsonIfMissing(file, data) {
  if (fs.existsSync(file)) return;
  writeJson(file, data);
}

function writeTextIfMissing(file, text) {
  if (fs.existsSync(file)) return;
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text);
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function splitList(value) {
  return String(value || "").split(",").map((item) => slugify(item)).filter(Boolean);
}

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return String(value || "").split(/[-_\s]+/).map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "").join(" ");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function arrayKey(items = []) {
  return [...items].sort().join("|");
}

function observationKey(item) {
  return [item.source, item.timestamp, item.type, item.observation].join("|");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function help() {
  console.log(`FG Lab Research Import Pipeline

Commands:
  node scripts/fg-research.js init [--games dbfz,2xko,tekken]
  node scripts/fg-research.js enqueue --game 2xko --transcript video.txt --title "Guide" --youtube https://...
  node scripts/fg-research.js process [--game 2xko]
  node scripts/fg-research.js verify --game 2xko --observation observation-id

Workflow:
  transcript -> import_queue -> observation extraction -> review -> verified_observations -> website
`);
}
