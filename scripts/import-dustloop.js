const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const charactersSource = path.join(root, "data", "characters-data.js");
const outputRoot = path.join(root, "public", "data", "dbfz");
const frameOutputRoot = path.join(outputRoot, "frame-data");
const dustloopBase = process.env.DUSTLOOP_BASE || "https://www.dustloop.com/w/DBFZ";

const explicitSlugs = {
  "ssj-goku": "Goku",
  "goku-blue": "Goku_(SSGSS)",
  "base-goku": "Goku",
  "gt-goku": "Goku_(GT)",
  "ui-goku": "Goku_(Ultra_Instinct)",
  "ssj4-goku-daima": "Goku_(SS4,_DAIMA)",
  "ssj-vegeta": "Vegeta",
  "vegeta-blue": "Vegeta_(SSGSS)",
  "base-vegeta": "Vegeta",
  "adult-gohan": "Gohan_(Adult)",
  "teen-gohan": "Gohan_(Teen)",
  "android-16": "Android_16",
  "android-17": "Android_17",
  "android-18": "Android_18",
  "android-21-majin": "Android_21",
  "android-21-lab-coat": "Android_21_(Lab_Coat)",
  "dbs-broly": "Broly_(DBS)",
  "dbz-broly": "Broly",
  "goku-black": "Goku_Black",
  "gogeta-blue": "Gogeta_(SSGSS)",
  "ssj4-gogeta": "Gogeta_(SS4)",
  "super-baby-2": "Super_Baby_2",
  "vegito-blue": "Vegito_(SSGSS)",
  "master-roshi": "Master_Roshi",
  "kid-buu": "Kid_Buu",
  "majin-buu": "Majin_Buu",
  ginyu: "Captain_Ginyu",
  zamasu: "Zamasu_(Fused)",
  frieza: "Frieza",
};

const slugFallbacks = {
  "goku-blue": ["Goku_Blue", "Goku_SSGSS"],
  "base-goku": ["Base_Goku", "Goku_(Base)", "Base Goku", "Goku"],
  "gt-goku": ["GT_Goku", "Goku_GT"],
  "vegeta-blue": ["Vegeta_Blue", "Vegeta_SSGSS"],
  "base-vegeta": ["Base_Vegeta", "Vegeta_(Base)", "Base Vegeta", "Vegeta"],
  "vegito-blue": ["Vegito_Blue", "Vegito_SSGSS"],
  "gogeta-blue": ["Gogeta_Blue", "Gogeta_SSGSS"],
  "ssj4-gogeta": ["Gogeta_SS4", "SS4_Gogeta"],
  "ssj4-goku-daima": [
    "Goku_(SS4,_DAIMA)",
    "Goku_(SS4,_Daima)",
    "Daima_Goku",
    "Goku_Daima",
    "Goku_(Mini)_DAIMA",
    "Goku_(Mini)",
    "SS4_Goku_Daima",
    "SSJ4_Goku_Daima",
  ],
  ginyu: ["Ginyu"],
  zamasu: ["Zamasu", "Fused_Zamasu"],
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  await fs.mkdir(frameOutputRoot, { recursive: true });
  const characters = await loadCharacters();
  const requested = new Set(process.argv.slice(2));
  const picked = requested.size ? characters.filter((character) => requested.has(character.id)) : characters;
  const importedAt = new Date().toISOString();
  const report = {
    source: "Dustloop",
    startedAt: importedAt,
    finishedAt: null,
    totalCharacters: picked.length,
    imported: [],
    failed: [],
  };

  await writeCharacterIndex(characters, importedAt);

  for (const character of picked) {
    try {
      const { html, sourceUrl } = await fetchDustloopCharacter(character);
      const moves = parseFrameTables(html);
      const payload = {
        character: character.name,
        characterId: character.id,
        source: "Dustloop",
        sourceUrl,
        lastImported: importedAt,
        moves,
      };
      await fs.writeFile(path.join(frameOutputRoot, `${character.id}.json`), JSON.stringify(payload, null, 2), "utf8");
      report.imported.push({ id: character.id, name: character.name, moveCount: moves.length, sourceUrl });
      console.log(`Imported ${moves.length} moves for ${character.name}`);
    } catch (error) {
      const sourceUrl = dustloopUrl(character);
      report.failed.push({ id: character.id, name: character.name, sourceUrl, error: error.message });
      console.warn(`Skipped ${character.name}: ${error.message}`);
    }
  }

  report.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(outputRoot, "import-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(`Import complete: ${report.imported.length} imported, ${report.failed.length} failed.`);
}

async function loadCharacters() {
  const source = await fs.readFile(charactersSource, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "characters-data.js" });
  return context.window.DBFZ_CHARACTER_DATA.characters.map((character) => ({
    id: character.id,
    name: character.name,
  }));
}

async function writeCharacterIndex(characters, importedAt) {
  const records = characters.map((character) => ({
    id: character.id,
    name: character.name,
    source: "Dustloop",
    sourceUrl: dustloopUrl(character),
    frameDataPath: `/public/data/dbfz/frame-data/${character.id}.json`,
    lastImported: importedAt,
  }));

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(
    path.join(outputRoot, "characters.json"),
    JSON.stringify({ generatedAt: importedAt, source: "Dustloop", characters: records }, null, 2),
    "utf8"
  );
}

function dustloopUrl(character) {
  const slug = explicitSlugs[character.id] || character.name.replace(/\s+/g, "_");
  return `${dustloopBase}/${encodeSlug(slug)}/Frame_Data`;
}

async function fetchDustloopCharacter(character) {
  const slugs = [
    explicitSlugs[character.id],
    ...(slugFallbacks[character.id] || []),
    character.name.replace(/\s+/g, "_"),
    character.name.replace(/\s+/g, ""),
  ].filter(Boolean);
  const uniqueSlugs = [...new Set(slugs)];
  let lastError = null;

  for (const slug of uniqueSlugs) {
    const sourceUrl = `${dustloopBase}/${encodeSlug(slug)}/Frame_Data`;
    console.log(`Importing ${character.name} from ${sourceUrl}`);
    try {
      return { html: await fetchText(sourceUrl), sourceUrl };
    } catch (error) {
      lastError = error;
      console.warn(`Attempt failed for ${character.name}: ${error.message}`);
    }
  }

  for (const slug of await discoverSlugCandidates(character)) {
    const sourceUrl = `${dustloopBase}/${encodeSlug(slug)}/Frame_Data`;
    console.log(`Importing ${character.name} from discovered page ${sourceUrl}`);
    try {
      return { html: await fetchText(sourceUrl), sourceUrl };
    } catch (error) {
      lastError = error;
      console.warn(`Discovered attempt failed for ${character.name}: ${error.message}`);
    }
  }

  throw lastError || new Error("No Dustloop slug candidates configured.");
}

async function discoverSlugCandidates(character) {
  const apiUrl = `${dustloopBase.replace(/\/w\/DBFZ$/, "/wiki")}/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(
    `DBFZ ${character.name}`
  )}`;
  try {
    const data = JSON.parse(await fetchText(apiUrl));
    return (data.query?.search || [])
      .map((result) => result.title)
      .filter((title) => title.startsWith("DBFZ/") && !title.endsWith("/Frame Data"))
      .map((title) => title.replace(/^DBFZ\//, ""));
  } catch {
    return [];
  }
}

function encodeSlug(slug) {
  return slug
    .split("/")
    .map((part) => encodeURIComponent(part).replaceAll("%28", "(").replaceAll("%29", ")"))
    .join("/");
}

async function fetchText(url) {
  if (typeof fetch !== "function") {
    throw new Error("This importer needs Node 18+ because it uses built-in fetch.");
  }
  const response = await fetch(url, {
    headers: {
      "user-agent": "DBFZ Team Lab frame data importer",
      accept: "text/html",
    },
  });
  if (!response.ok) throw new Error(`Dustloop returned HTTP ${response.status}`);
  return response.text();
}

function parseFrameTables(html) {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((match) => match[0]);
  const moves = [];

  for (const table of tables) {
    const headers = tableHeaders(table);
    if (!isFrameDataTable(headers)) continue;

    for (const row of tableRows(table)) {
      const cells = tableCells(row);
      if (cells.length < 2) continue;
      const move = normalizeMove(headers, cells);
      if (move?.move) moves.push(move);
    }
  }

  return dedupeMoves(moves);
}

function isFrameDataTable(headers) {
  const text = headers.join(" ").toLowerCase();
  return /startup|start-up|damage|recovery|block|advantage|active/.test(text);
}

function tableHeaders(table) {
  const firstRow = table.match(/<tr[\s\S]*?<\/tr>/i)?.[0] || "";
  return tableCells(firstRow);
}

function tableRows(table) {
  return [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].slice(1).map((match) => match[0]);
}

function tableCells(row) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => cleanCell(match[1]));
}

function cleanCell(value) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<sup[\s\S]*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&minus;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMove(headers, cells) {
  const byHeader = {};
  headers.forEach((header, index) => {
    byHeader[normalizeHeader(header)] = cells[index] || "";
  });

  const move = {
    move: pick(byHeader, ["move", "input", "name", "attack", "command"]),
    damage: pick(byHeader, ["damage", "dmg"]),
    startup: pick(byHeader, ["startup", "start up", "start-up", "start"]),
    active: pick(byHeader, ["active", "act"]),
    recovery: pick(byHeader, ["recovery", "rec"]),
    blockAdvantage: pick(byHeader, ["on block", "block advantage", "block adv", "block", "advantage"]),
    hitAdvantage: pick(byHeader, ["on hit", "hit advantage", "hit adv", "hit"]),
    invulnerability: pick(byHeader, ["invuln", "invulnerability", "invul"]),
    notes: pick(byHeader, ["notes", "properties", "attribute", "guard", "description"]),
  };
  if (isHeaderLikeMove(move)) return null;
  return move;
}

function normalizeHeader(value) {
  return value.toLowerCase().replace(/[.:]/g, "").replace(/\s+/g, " ").trim();
}

function pick(source, candidates) {
  for (const candidate of candidates) {
    const exact = source[candidate];
    if (exact) return exact;
    const loose = Object.entries(source).find(([key]) => key.includes(candidate));
    if (loose?.[1]) return loose[1];
  }
  return "";
}

function dedupeMoves(moves) {
  const seen = new Set();
  return moves.filter((move) => {
    if (!move) return false;
    const key = `${move.move}|${move.startup}|${move.damage}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isHeaderLikeMove(move) {
  const values = Object.values(move).map((value) => String(value).toLowerCase());
  return values.includes("startup") || values.includes("damage") || move.move?.toLowerCase() === "input";
}
