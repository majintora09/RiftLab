const fs = require("fs");
const https = require("https");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assetDir = path.join(root, "assets", "games", "2xko", "characters");
const dataDir = path.join(root, "data", "games", "2xko");
const publicDataDir = path.join(root, "public", "data", "2xko");
const champions = ["ahri", "akali", "blitzcrank", "braum", "caitlyn", "darius", "ekko", "illaoi", "jinx", "senna", "teemo", "thresh", "vi", "warwick", "yasuo"];

const supplemental = {
  ahri: {
    difficulty: "Intermediate",
    learningPriorities: ["Control orb positions before overextending.", "Practice approach routes that keep Spirit Rush available as a threat.", "Review assist calls that let her start pressure safely."],
    strengths: ["Mobile offense built around orb control and multi-angle pressure.", "Can threaten movement, whiff punishment, and pressure resets.", "Official kit emphasizes mobility and magical zoning tools."],
    weaknesses: ["Partner-dependent pressure and route stability still need review.", "Research In Progress", "Research In Progress"],
  },
  akali: {
    difficulty: "Advanced",
    learningPriorities: ["Learn Twilight Shroud states and when grounded specials become empowered.", "Practice shroud movement that crosses through opponents.", "Confirm which assists protect shroud entry in match footage."],
    strengths: ["Fast rushdown identity with shroud-enhanced specials.", "Can use Twilight Shroud movement to slip past defenses.", "Air and ground specials give several approach angles."],
    weaknesses: ["Requires shroud awareness and clean routing to keep pressure coherent.", "Risk profile of smoke setups needs more reviewed match data.", "Research In Progress"],
  },
  blitzcrank: {
    difficulty: "Intermediate",
    learningPriorities: ["Build gameplans around hook threat and space denial.", "Practice tag routes after grabs or anti-air conversions.", "Track which partners convert best after pull interactions."],
    strengths: ["Large-body control character with disruptive grab threat.", "Can force opponents to respect long-range engagement attempts.", "Useful for teams that want a simple way to threaten neutral mistakes."],
    weaknesses: ["Whiffed commitment and recovery risks need matchup review.", "Can need partner help to approach safely after opponents slow the pace.", "Research In Progress"],
  },
  braum: {
    difficulty: "Beginner Friendly",
    learningPriorities: ["Use shield and defensive calls to stabilize neutral.", "Practice corner carry routes that cash out after armored control.", "Review teams that turn protection into forward pressure."],
    strengths: ["Defensive protector identity with sturdy space control.", "Can make aggressive partners safer by covering approaches.", "Straightforward team value: durability, protection, and control."],
    weaknesses: ["May need a partner who supplies speed or layered mix.", "Offense-specific conclusions still need verified match data.", "Research In Progress"],
  },
  caitlyn: {
    difficulty: "Intermediate",
    learningPriorities: ["Practice long-range control into confirms.", "Study trap and rifle spacing before choosing a partner.", "Verify which assists let her convert from screen-control hits."],
    strengths: ["Marksman identity with long-range pressure and trap control.", "Can shape neutral around lanes and threat zones.", "Naturally supports patient, space-first team plans."],
    weaknesses: ["Close-range defensive needs require more review.", "Duo routing after far hits is still research in progress.", "Research In Progress"],
  },
  darius: {
    difficulty: "Beginner Friendly",
    learningPriorities: ["Prioritize consistent punish and corner routes.", "Practice converting command pressure into tag offense.", "Review partners that cover his path into close range."],
    strengths: ["Direct bruiser gameplan with high-impact close-range offense.", "Easy-to-understand win condition: get in, hit hard, keep advantage.", "Works as a stable damage threat for newer team builders."],
    weaknesses: ["Needs help when opponents avoid his preferred range.", "Route and matchup details should be verified before ranking partners.", "Research In Progress"],
  },
  ekko: {
    difficulty: "Advanced",
    learningPriorities: ["Learn time-clone movement and pressure timing.", "Practice tag sequences that preserve ambiguity.", "Review which assists make his setup routes practical."],
    strengths: ["Technical mixup character with movement and time-themed pressure.", "Can create layered offense when setup timing is understood.", "Rewards players who like labbing routes and reset structures."],
    weaknesses: ["Execution and setup timing can raise the learning curve.", "Needs reviewed data before making firm partner claims.", "Research In Progress"],
  },
  illaoi: {
    difficulty: "Intermediate",
    learningPriorities: ["Learn tentacle placement and when to fight around it.", "Practice pressure sequences that keep the opponent near active threats.", "Review partners that hold opponents in her preferred zones."],
    strengths: ["Setplay bruiser identity built around tentacle control.", "Strong when she makes the opponent fight in prepared space.", "Can reward teams that value sustained pressure over pure speed."],
    weaknesses: ["May need help starting offense before setplay is established.", "Partner requirements and defensive gaps need more footage.", "Research In Progress"],
  },
  jinx: {
    difficulty: "Intermediate",
    learningPriorities: ["Practice projectile and weapon control at multiple ranges.", "Learn confirms from explosive screen-control hits.", "Review assist coverage that lets her safely reload pressure."],
    strengths: ["Chaotic keepaway and pressure identity with explosive tools.", "Can make neutral uncomfortable through varied projectile threats.", "Fits teams that want ranged disruption and high momentum swings."],
    weaknesses: ["Needs protection when opponents bypass her preferred range.", "Exact defensive problem points need reviewed matchup footage.", "Research In Progress"],
  },
  senna: {
    difficulty: "Intermediate",
    learningPriorities: ["Learn how her range controls lanes and protects tags.", "Practice assist calls that convert from long-range pressure.", "Verify route priorities from current Season 2 footage."],
    strengths: ["Long-range marksman/support identity with lane control.", "Can contribute screen presence to teams that want patient neutral.", "Provides ranged threat and utility while research develops."],
    weaknesses: ["Season 2 team conclusions are still developing.", "Close-range pressure answers need verification.", "Research In Progress"],
  },
  teemo: {
    difficulty: "Intermediate",
    learningPriorities: ["Practice trap placement and projectile timing.", "Study how pebbles or traps cover partner approaches.", "Track which observations graduate from vault notes to verified synergy."],
    strengths: ["Setplay and nuisance control through traps and projectiles.", "Can cover partner movement and make approaches less predictable.", "Current vault observations already show utility with Ahri pressure."],
    weaknesses: ["Needs review for consistency under pressure.", "Team value can depend on whether the partner capitalizes on trap coverage.", "Research In Progress"],
  },
  thresh: {
    difficulty: "Advanced",
    learningPriorities: ["Practice hook and lantern-style control routes.", "Study which partners benefit most from his repositioning threat.", "Keep early Season 2 notes separated from verified conclusions."],
    strengths: ["Control/support identity with hook-style threat and team utility.", "Can force respect through space denial and unusual angles.", "Promising for teams that value positioning tools."],
    weaknesses: ["Newer roster knowledge needs more reviewed footage.", "Partner-specific conclusions are research in progress.", "Research In Progress"],
  },
  vi: {
    difficulty: "Beginner Friendly",
    learningPriorities: ["Practice armored/forward movement confirms.", "Learn simple tag routes after close-range hits.", "Review partners that help her enter without spending too many resources."],
    strengths: ["Forward-moving brawler identity with explosive close-range offense.", "Clear gameplan for players who like direct pressure.", "Can anchor simple duo plans around threat, damage, and momentum."],
    weaknesses: ["Needs help against opponents who deny entry.", "Exact assist preferences need verified match review.", "Research In Progress"],
  },
  warwick: {
    difficulty: "Intermediate",
    learningPriorities: ["Practice pursuit routes and scramble conversion.", "Study how his offense changes with resources and team cover.", "Verify current Season 0/1 footage before labeling partners."],
    strengths: ["Aggressive hunter identity built around pursuit and close-range threat.", "Can punish hesitation and force scramble-heavy decisions.", "Useful for players who want momentum and pressure."],
    weaknesses: ["Needs controlled entries when opponents play keepaway.", "Partner conclusions are still research in progress.", "Research In Progress"],
  },
  yasuo: {
    difficulty: "Intermediate",
    learningPriorities: ["Practice wind-based pressure and corner wakeup structures.", "Learn tag routes that preserve screen position.", "Review partners that cover neutral entry before ranking them."],
    strengths: ["Mobile swordsman identity with strong momentum once offense starts.", "Wind tools and movement can support pressure-heavy teams.", "Vault observations already show Yasuo pressure after Blitzcrank routing."],
    weaknesses: ["Needs help controlling space before momentum starts.", "Route choices and partner payoffs can become technical.", "Research In Progress"],
  },
};

const colors = {
  ahri: "#b87760",
  akali: "#3b301e",
  blitzcrank: "#54552b",
  braum: "#532a50",
  caitlyn: "#27354e",
  darius: "#5b2a22",
  ekko: "#2d4322",
  illaoi: "#76572c",
  jinx: "#2b3155",
  senna: "#3f2b20",
  teemo: "#525c2e",
  thresh: "#264221",
  vi: "#272c4d",
  warwick: "#524829",
  yasuo: "#1e303d",
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  fs.mkdirSync(assetDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(publicDataDir, { recursive: true });

  const records = [];
  for (const id of champions) {
    const page = await fetchText(`https://2xko.riotgames.com/en-us/champions/${id}/`);
    const data = parseNextData(page);
    const profile = extractProfile(data, id);
    const imageUrl = profile.cardImageUrl || profile.metaImageUrl;
    const extension = imageUrl && imageUrl.includes(".jpg") ? "jpg" : "png";
    const fileName = `${id}.${extension}`;
    if (imageUrl) await downloadFile(imageUrl, path.join(assetDir, fileName));

    const extra = supplemental[id] || {};
    const characterRecord = {
      character: profile.name,
      title: profile.title,
      region: profile.region,
      portrait: `/assets/games/2xko/characters/${fileName}`,
      sourceUrl: `https://2xko.riotgames.com/en-us/champions/${id}/`,
      identity: profile.description,
      playstyle: profile.archetype ? `${profile.archetype}. ${profile.description}` : profile.description,
      difficulty: extra.difficulty || "Research In Progress",
      archetypes: unique([profile.archetype, ...(extra.archetypes || [])]),
      strengths: unique(extra.strengths || ["Research In Progress"]),
      weaknesses: unique(extra.weaknesses || ["Research In Progress"]),
      partnerWants: partnerWantsFor(id),
      teamProvides: teamProvidesFor(id, extra, profile),
      learningPriorities: extra.learningPriorities || ["Research In Progress"],
      recommendedPartners: [],
      recommendedFuses: [],
      synergyNotes: ["Research In Progress"],
      matchupNotes: ["Research In Progress"],
      routes: [],
      communityTech: ["Research In Progress"],
      questions: ["Who should I pair with this character?", "What fuse works best?", "What should I learn first?"],
    };

    fs.writeFileSync(path.join(dataDir, `${id}.json`), `${JSON.stringify(characterRecord, null, 2)}\n`);
    records.push({
      id,
      gameId: "2xko",
      name: profile.name,
      title: profile.title,
      region: profile.region,
      overview: profile.description,
      portrait: `/assets/games/2xko/characters/${fileName}`,
      sourceUrl: `https://2xko.riotgames.com/en-us/champions/${id}/`,
      archetypes: characterRecord.archetypes,
      strengths: characterRecord.strengths,
      weaknesses: characterRecord.weaknesses,
      learningPriorities: characterRecord.learningPriorities,
      recommendedPartnerIds: [],
      recommendedFuseIds: [],
      recommendedRouteIds: [],
      notes: ["Official 2XKO champion page imported. Competitive conclusions remain marked as research in progress until verified."],
    });
  }

  fs.writeFileSync(
    path.join(publicDataDir, "characters.json"),
    `${JSON.stringify({ version: 2, updatedAt: new Date().toISOString().slice(0, 10), status: "official-import", characters: records }, null, 2)}\n`
  );
}

function parseNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Could not find __NEXT_DATA__.");
  return JSON.parse(match[1]);
}

function extractProfile(data, id) {
  const props = data?.props?.pageProps || {};
  const page = props.page || props.data || props;
  const all = [];
  walk(page, (value) => all.push(value));
  const champion = all.find((value) => value && value.type === "twoXkoChampion") || page;
  const textValues = all.filter((value) => value && typeof value === "object");
  const title = findString(textValues, ["subtitle", "subTitle", "kicker"]) || "";
  const region = findLabeledText(textValues, "Region") || "";
  const archetype = findLabeledText(textValues, "Archetype") || "";
  const description =
    props.description ||
    champion.description ||
    findMetaDescription(data) ||
    "";
  const name = findName(champion, id);
  const cardImageUrl = findCardImageUrl(all, name);
  const metaImageUrl = props.metaImage?.url || findImageUrl(all, "1920x1080") || "";
  return { name, title, region, archetype, description, cardImageUrl, metaImageUrl };
}

function walk(value, visit) {
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => walk(item, visit));
}

function findName(champion, id) {
  const expected = id.replace("-", " ").toUpperCase();
  const direct = champion?.title || champion?.name || "";
  if (String(direct).toUpperCase().includes(expected.split(" ")[0])) return titleCase(id);
  return titleCase(id);
}

function findString(objects, keys) {
  for (const object of objects) {
    for (const key of keys) {
      if (typeof object[key] === "string" && object[key].trim()) return object[key].trim();
    }
  }
  return "";
}

function findLabeledText(objects, label) {
  for (const object of objects) {
    const body = object?.body || object?.text || object?.label || "";
    if (typeof body !== "string") continue;
    const htmlMatch = body.match(new RegExp(`<strong>${label}:<\\/strong>\\s*([^<\\n]+)`, "i"));
    if (htmlMatch) return stripHtml(htmlMatch[1]).trim();
    const text = stripHtml(body).replace(/\s+/g, " ");
    const match = text.match(new RegExp(`${label}:\\s*([^:]+?)(?:\\s+[A-Z][A-Za-z ]+:|$)`, "i"));
    if (match) return match[1].trim();
  }
  return "";
}

function findMetaDescription(data) {
  const out = [];
  walk(data, (value) => {
    if (value && typeof value === "object" && value.name === "description" && value.content) out.push(value.content);
  });
  return out[0] || "";
}

function findCardImageUrl(values, name) {
  const upper = name.toUpperCase();
  for (const value of values) {
    if (!value || typeof value !== "object") continue;
    if (String(value.title || "").toUpperCase() === upper && value.media?.url) return value.media.url;
  }
  return "";
}

function findImageUrl(values, needle) {
  const image = values.find((value) => value && typeof value === "object" && typeof value.url === "string" && value.url.includes(needle));
  return image?.url || "";
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, "");
}

function partnerWantsFor(id) {
  const wants = {
    ahri: ["Safe approach cover", "Lockdown for orb pressure", "Route stability after mobile confirms"],
    akali: ["Assist cover for Twilight Shroud entries", "Lockdown that holds opponents in place", "A partner who converts after fast scrambles"],
    blitzcrank: ["Fast point characters who capitalize on pull threat", "Coverage when hook or grab attempts are blocked", "Routes that turn disruption into stable pressure"],
    braum: ["Fast offense to benefit from protection", "A partner with layered mix", "Conversions after defensive control"],
    caitlyn: ["Frontline protection", "Assist routes from long-range hits", "A partner who benefits from trap or rifle control"],
    darius: ["Neutral cover to enter close range", "Assist calls that protect heavy commitments", "Partners who cash out after his damage threat"],
    ekko: ["Lockdown for clone/setup timing", "Partners who create time to layer mix", "Stable conversions from technical starters"],
    illaoi: ["Lockdown that keeps opponents near tentacles", "Neutral cover before setplay starts", "Partners who convert from prepared-space hits"],
    jinx: ["Protection against rushdown", "Partners who exploit projectile disruption", "Assist cover for explosive screen control"],
    senna: ["Frontline pressure", "Conversions from ranged control", "Teams that value patient neutral"],
    teemo: ["Partners who use trap cover to approach", "Pressure characters who benefit from nuisance projectiles", "Route testing around setplay hits"],
    thresh: ["Partners who exploit repositioning", "Lockdown for hook/control threats", "More verified footage before firm recommendations"],
    vi: ["Screen control to help her enter", "Lockdown after forward movement", "Partners who extend close-range hits"],
    warwick: ["Assist cover for pursuit", "Control tools against keepaway", "Partners who stabilize scrambles"],
    yasuo: ["Neutral cover before momentum starts", "Assist calls that preserve pressure", "Routes that convert into corner or wind pressure"],
  };
  return wants[id] || ["Research In Progress"];
}

function teamProvidesFor(id, extra, profile) {
  const firstStrengths = (extra.strengths || []).slice(0, 2);
  return unique([profile.archetype ? `${profile.archetype} team role` : "", ...firstStrengths]).filter(Boolean);
}

function unique(items) {
  return [...new Set((items || []).map((item) => String(item || "").trim()).filter(Boolean))];
}

function titleCase(value) {
  return String(value || "").split("-").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "").join(" ");
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchText(response.headers.location).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`${url} returned HTTP ${response.statusCode}`));
        response.resume();
        return;
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

function downloadFile(url, destination) {
  const cleanUrl = url.replaceAll("&amp;", "&");
  return new Promise((resolve, reject) => {
    https.get(cleanUrl, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`${cleanUrl} returned HTTP ${response.statusCode}`));
        response.resume();
        return;
      }
      const file = fs.createWriteStream(destination);
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    }).on("error", reject);
  });
}
