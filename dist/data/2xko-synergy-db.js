(() => {
  const root = window.FG_LAB_GAMES?.find((game) => game.id === "2xko")?.synergyRoot || "/data/games/2xko/synergies";
  const cache = new Map();
  let indexPromise = null;

  function normalizeCharacterId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function pairId(first, second) {
    const pair = [normalizeCharacterId(first), normalizeCharacterId(second)].sort((a, b) => a.localeCompare(b));
    if (!pair[0] || !pair[1] || pair[0] === pair[1]) throw new Error("Choose two different 2XKO characters.");
    return pair.join("-");
  }

  function assetPath(relativePath) {
    return window.FG_LAB_ASSET_PATH?.(relativePath) || relativePath.replace(/^\//, "");
  }

  async function fetchJson(relativePath) {
    const url = assetPath(relativePath);
    if (!cache.has(url)) {
      cache.set(url, fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Synergy data returned HTTP ${response.status}.`);
        return response.json();
      }));
    }
    return cache.get(url);
  }

  function loadIndex() {
    if (!indexPromise) indexPromise = fetchJson(`${root}/index.json`);
    return indexPromise;
  }

  async function loadTeam(first, second) {
    const id = pairId(first, second);
    return fetchJson(`${root}/${id}.json`);
  }

  async function listForCharacter(characterId) {
    const id = normalizeCharacterId(characterId);
    const index = await loadIndex();
    return (index.combinations || []).filter((entry) => entry.team.includes(id));
  }

  async function loadForCharacter(characterId) {
    const entries = await listForCharacter(characterId);
    return Promise.all(entries.map((entry) => fetchJson(`${root}/${entry.file}`)));
  }

  function clearCache() {
    cache.clear();
    indexPromise = null;
  }

  window.FG_LAB_2XKO_SYNERGY_DB = {
    clearCache,
    listForCharacter,
    loadForCharacter,
    loadIndex,
    loadTeam,
    normalizeCharacterId,
    pairId,
  };
})();
