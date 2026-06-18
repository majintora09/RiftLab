const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const rawDir = path.join(root, "public", "characters", "raw");
const portraitDir = path.join(root, "public", "characters", "portraits");
const outPath = path.join(root, "assets", "manifest.js");

const fileAliases = {
  "adult-gohan": "A-Gohan.png",
  "android-16": "Android-16.png",
  "android-17": "Android-17.png",
  "android-18": "Android-18.png",
  "android-21-majin": "Android-21.png",
  "android-21-lab-coat": "Lab-coat.png",
  bardock: "Bardock.png",
  "base-goku": "Base-Goku.png",
  "base-vegeta": "Base-Vegeta.png",
  beerus: "Beerus.png",
  cell: "Cell.png",
  cooler: "Cooler.png",
  "dbs-broly": "DBS-Broly.png",
  "dbz-broly": "Z-Broly.png",
  frieza: "Freeza.png",
  ginyu: "Ginyu.png",
  "gogeta-blue": "Gogeta-Blue.png",
  "ssj4-gogeta": "Gogeta-SS4.png",
  "ssj4-goku-daima": "ssj4-goku-daima.png",
  "goku-black": "Goku-Black.png",
  "goku-blue": "Goku-Blue.png",
  "vegeta-blue": "Vegeta-Blue.png",
  gotenks: "Gotenks.png",
  "gt-goku": "GT Goku.png",
  hit: "Hit.png",
  janemba: "Janemba.png",
  jiren: "Jiren.png",
  kefla: "Kefla.png",
  "kid-buu": "Kid-Buu.png",
  krillin: "Krillin.png",
  "majin-buu": "Majin-Buu.png",
  "master-roshi": "Master-Roshi.png",
  nappa: "Nappa.png",
  piccolo: "Piccolo.png",
  "ssj-goku": "SSJ-Goku.png",
  "ssj-vegeta": "SSJ-Vegeta.png",
  "super-baby-2": "Super-Baby.png",
  "teen-gohan": "Teen-Gohan.png",
  tien: "Tien.png",
  trunks: "Trunks.png",
  "ui-goku": "UI-Goku.png",
  "vegito-blue": "Vegito.png",
  videl: "Videl.png",
  yamcha: "Yamcha.png",
  zamasu: "Zamasu.png",
};

const data = JSON.parse(fs.readFileSync(path.join(root, "data", "characters.raw.json"), "utf8"));
const rawFiles = fs.existsSync(rawDir) ? new Set(fs.readdirSync(rawDir)) : new Set();
const portraitFiles = fs.existsSync(portraitDir) ? new Set(fs.readdirSync(portraitDir)) : new Set();

const manifest = {
  backgrounds: {
    hero: fs.existsSync(path.join(root, "assets", "backgrounds", "background.webp"))
      ? "assets/backgrounds/background.webp"
      : "",
  },
  characters: {},
};

const missing = [];

for (const character of data.characters) {
  const webp = `${character.id}.webp`;
  const png = `${character.id}.png`;
  const raw = fileAliases[character.id];

  if (portraitFiles.has(webp)) {
    manifest.characters[character.id] = { portrait: `public/characters/portraits/${webp}` };
  } else if (portraitFiles.has(png)) {
    manifest.characters[character.id] = { portrait: `public/characters/portraits/${png}` };
  } else if (raw && rawFiles.has(raw)) {
    manifest.characters[character.id] = { portrait: `public/characters/raw/${raw}` };
  } else {
    missing.push(`${character.id} (${character.name})`);
  }
}

fs.writeFileSync(outPath, `window.DBFZ_ASSETS = ${JSON.stringify(manifest, null, 2)};\n`);

console.log(`Wrote ${path.relative(root, outPath)}`);
if (missing.length) {
  console.log("Missing portraits:");
  for (const item of missing) console.log(`- ${item}`);
}
