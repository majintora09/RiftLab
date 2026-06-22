const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "data", "games", "2xko", "synergies");
const overwrite = process.argv.includes("--overwrite");

function loadRoster() {
  const sandbox = { window: {} };
  const config = fs.readFileSync(path.join(root, "data", "games.js"), "utf8");
  vm.runInNewContext(config, sandbox, { filename: "data/games.js" });
  const game = sandbox.window.FG_LAB_GAMES?.find((item) => item.id === "2xko");
  const roster = game?.intelligenceFiles;
  if (!Array.isArray(roster) || roster.length < 2) throw new Error("2XKO intelligenceFiles roster is missing.");
  return [...new Set(roster.map(normalizeId))].sort((a, b) => a.localeCompare(b));
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pairId(first, second) {
  const pair = [normalizeId(first), normalizeId(second)].sort((a, b) => a.localeCompare(b));
  if (!pair[0] || !pair[1] || pair[0] === pair[1]) throw new Error("A synergy requires two different character IDs.");
  return pair.join("-");
}

function emptySynergy(team) {
  return {
    team,
    rating: null,
    difficulty: null,
    playstyles: [],
    strengths: [],
    weaknesses: [],
    recommendedFuses: [],
    routes: [],
    notes: [],
    sources: [],
    verified: false,
  };
}

function generate() {
  const roster = loadRoster();
  const combinations = [];
  let created = 0;
  let preserved = 0;
  fs.mkdirSync(output, { recursive: true });

  for (let first = 0; first < roster.length; first += 1) {
    for (let second = first + 1; second < roster.length; second += 1) {
      const team = [roster[first], roster[second]];
      const id = pairId(...team);
      const file = `${id}.json`;
      const destination = path.join(output, file);
      combinations.push({ id, file, team });
      if (fs.existsSync(destination) && !overwrite) {
        JSON.parse(fs.readFileSync(destination, "utf8"));
        preserved += 1;
        continue;
      }
      writeJson(destination, emptySynergy(team));
      created += 1;
    }
  }

  writeJson(path.join(output, "index.json"), {
    version: 1,
    game: "2xko",
    naming: "alphabetical-character-slugs",
    roster,
    combinationCount: combinations.length,
    combinations,
  });

  console.log(`2XKO synergies: ${combinations.length} combinations (${created} created, ${preserved} preserved).`);
}

function writeJson(destination, value) {
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`);
}

if (require.main === module) generate();

module.exports = { emptySynergy, generate, loadRoster, normalizeId, pairId };
