const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const inputPath = path.join(root, "transcript.txt");
const outDir = path.join(root, "data");

const transcript = fs.readFileSync(inputPath, "utf8").replace(/\r\n/g, "\n");

function cleanText(text) {
  return text
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:\d+\s+)?(?:hours?|minutes?)(?:,\s*\d+\s+minutes?)?(?:,\s*\d+\s+seconds?)?\s*/gi, " ")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstSentences(text, count = 2) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, count).join(" ").trim() || text.slice(0, 240).trim();
}

function includesAny(text, words) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function score(text, words) {
  const lower = text.toLowerCase();
  return words.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0);
}

function deriveProfile(text) {
  const roles = [];
  const metrics = {
    damage: Math.min(10, 3 + score(text, ["huge damage", "high damage", "big damage", "loops", "limit break", "meter dump", "level three"]) * 2),
    neutral: Math.min(10, 3 + score(text, ["neutral", "beam", "projectile", "key blast", "full screen", "zoning", "anti-zoning", "pokes"]) * 1.4),
    mix: Math.min(10, 2 + score(text, ["mix", "50/50", "left right", "high low", "command grab", "grab", "oki"]) * 1.35),
    support: Math.min(10, 2 + score(text, ["assist", "blockstun", "support", "dhc", "tag", "setup"]) * 1.4),
    ease: Math.max(2, 9 - score(text, ["hard", "difficult", "precise", "timing", "advanced", "complex", "specific"]) * 1.1),
  };

  if (includesAny(text, ["rush down", "rushdown", "aggression", "aggressive"])) roles.push("Rushdown");
  if (includesAny(text, ["zoner", "zoning", "projectile", "beam", "key blast"])) roles.push("Zoner");
  if (includesAny(text, ["command grab", "grappler", "grab"])) roles.push("Grappler");
  if (includesAny(text, ["assist", "support", "dhc"])) roles.push("Support");
  if (includesAny(text, ["mix", "50/50", "left right", "high low"])) roles.push("Mix");
  if (includesAny(text, ["huge damage", "big damage", "high damage", "loops"])) roles.push("Damage");

  const strengths = [];
  const weaknesses = [];
  const wants = [];

  if (metrics.neutral >= 7) strengths.push("Strong screen control or neutral presence.");
  if (metrics.damage >= 7) strengths.push("High reward when the character gets a clean hit.");
  if (metrics.mix >= 7) strengths.push("Real mixup threat with assist, oki, or meter behind it.");
  if (metrics.support >= 7) strengths.push("Useful team value through assists, DHC routes, or tag setups.");
  if (includesAny(text, ["level three", "level 3", "oki"])) strengths.push("Has meaningful knockdown or level 3 routing to build around.");
  if (includesAny(text, ["reversal", "dp", "counter", "frame one", "frame four"])) strengths.push("Has defensive or counter-poke tools that can change momentum.");

  if (includesAny(text, ["hard", "difficult", "precise", "timing", "complex"])) weaknesses.push("Needs practice because several routes or setups are timing-sensitive.");
  if (includesAny(text, ["committal", "punish", "counterable", "too h", "2hable"])) weaknesses.push("Some key tools can be punished when used predictably.");
  if (includesAny(text, ["limited", "doesn't really have", "not the biggest", "slower"])) weaknesses.push("Has at least one clear limitation that team support should cover.");
  if (weaknesses.length === 0) weaknesses.push("Needs matchup and assist testing before the notes can be considered complete.");

  if (includesAny(text, ["neutral", "approach", "mobility"])) wants.push("neutral cover");
  if (includesAny(text, ["mix", "blockstun", "lockdown", "50/50"])) wants.push("lockdown");
  if (includesAny(text, ["convert", "confirm", "straight hit"])) wants.push("conversion help");
  if (includesAny(text, ["meter", "level three", "level 3", "golden"])) wants.push("meter plan");
  if (wants.length === 0) wants.push("assist testing");

  const roleText = roles.slice(0, 3).join(" / ") || "Flexible";
  const leadStrength = (strengths[0] || "a specific team role").replace(/[.!?]+$/, "").toLowerCase();
  const summary = `${roleText} character. The transcript points toward ${leadStrength}, with ${wants[0]} as the first synergy question.`;

  return {
    summary,
    roles: roles.length ? [...new Set(roles)].slice(0, 4) : ["Flexible"],
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    wants: [...new Set(wants)].slice(0, 4),
    metrics,
  };
}

function classifySection(title) {
  const lower = title.toLowerCase();
  const techTitles = [
    "combos",
    "ghost oki",
    "saibamen restands",
    "oki & fat toss restands",
    "boj oki",
    "236m lariat",
  ];
  return techTitles.some((marker) => lower.includes(marker)) ? "tech" : "character";
}

const chapterRegex = /^Chapter\s+(\d+):\s*(.+)$/gm;
const matches = [...transcript.matchAll(chapterRegex)];

const sections = matches.map((match, index) => {
  const start = match.index + match[0].length;
  const end = index + 1 < matches.length ? matches[index + 1].index : transcript.length;
  const title = match[2].trim();
  const rawText = transcript.slice(start, end).trim();

  return {
    chapter: Number(match[1]),
    title,
    sectionType: classifySection(title),
    rawTitle: match[0],
    text: cleanText(rawText),
  };
});

const characters = [];
let currentCharacter = null;

for (const section of sections) {
  if (section.sectionType === "character") {
    currentCharacter = {
      id: slugify(section.title),
      name: section.title,
      chapter: section.chapter,
      summary: firstSentences(section.text),
      profile: deriveProfile(section.text),
      sourceText: section.text,
      extraSections: [],
    };
    characters.push(currentCharacter);
    continue;
  }

  if (!currentCharacter) {
    continue;
  }

  currentCharacter.extraSections.push({
    chapter: section.chapter,
    title: section.title,
    text: section.text,
  });
  currentCharacter.sourceText = `${currentCharacter.sourceText}\n\n${section.title}: ${section.text}`;
  currentCharacter.profile = deriveProfile(currentCharacter.sourceText);
}

const output = {
  generatedFrom: "transcript.txt",
  generatedAt: new Date().toISOString(),
  notes:
    "Timestamps and transcript timing artifacts were removed. Non-character tech chapters were attached to the previous character.",
  characterCount: characters.length,
  characters,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "characters.raw.json"), `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "characters-data.js"), `window.DBFZ_CHARACTER_DATA = ${JSON.stringify(output, null, 2)};\n`);

const markdown = [
  "# DBFZ Transcript Character Notes",
  "",
  "_Generated from transcript.txt. Timestamps removed; tech chapters attached to their previous character._",
  "",
  ...characters.flatMap((character) => [
    `## ${character.name}`,
    "",
    `Chapter: ${character.chapter}`,
    "",
    `Generalized summary: ${character.profile.summary}`,
    "",
    `Roles: ${character.profile.roles.join(", ")}`,
    "",
    "Strengths:",
    ...character.profile.strengths.map((item) => `- ${item}`),
    "",
    "Watch for:",
    ...character.profile.weaknesses.map((item) => `- ${item}`),
    "",
    `Assist/team wants: ${character.profile.wants.join(", ")}`,
    "",
    "",
  ]),
].join("\n");

fs.writeFileSync(path.join(outDir, "character-notes.cleaned.md"), markdown);

console.log(`Processed ${sections.length} chapters into ${characters.length} character entries.`);
console.log(`Wrote ${path.join("data", "characters.raw.json")}`);
console.log(`Wrote ${path.join("data", "characters-data.js")}`);
console.log(`Wrote ${path.join("data", "character-notes.cleaned.md")}`);
