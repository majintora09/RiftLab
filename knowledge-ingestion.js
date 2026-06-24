(() => {
  const storageKey = "fg-lab:2xko-knowledge-store:v1";
  const sourceTypes = ["YouTube Video", "Transcript Text", "Community Notes", "Tournament Notes", "Manual Notes"];
  const knowledgeKinds = [
    ["character-summary", "Character summaries"],
    ["synergy-note", "Synergy notes"],
    ["team-recommendation", "Team recommendations"],
    ["neutral-concept", "Neutral concepts"],
    ["combo-concept", "Combo concepts"],
    ["fuse-discussion", "Fuse discussions"],
    ["matchup-discussion", "Matchup discussions"],
  ];
  const synergyFields = [
    ["strength", "Strengths"],
    ["weakness", "Weaknesses"],
    ["win-condition", "Win Condition"],
    ["recommended-fuse", "Recommended Fuse"],
    ["combo-synergy", "Combo Synergy"],
    ["neutral-synergy", "Neutral Synergy"],
    ["defensive-synergy", "Defensive Synergy"],
  ];
  const state = {
    container: null,
    page: null,
    seed: { sources: [], extractedKnowledge: [] },
    local: { sources: [], extractedKnowledge: [] },
    characters: [],
    loaded: false,
    error: "",
    filters: { query: "", character: "all", kind: "all", sourceType: "all" },
    selectedPair: [],
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function load(game, characters = []) {
    state.characters = characters;
    state.local = loadLocalStore();
    try {
      const root = String(game?.dataRoot || "/public/data/2xko").replace(/\/$/, "");
      const file = game?.dataFiles?.knowledgeStore || "knowledge-store.json";
      const source = window.FG_LAB_ASSET_PATH?.(`${root}/${file}`) || `${root}/${file}`;
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Knowledge store returned HTTP ${response.status}.`);
      const data = await response.json();
      state.seed = normalizeStore(data);
    } catch (error) {
      state.error = error.message || "Knowledge store could not be loaded.";
    } finally {
      state.loaded = true;
      if (!state.selectedPair.length) state.selectedPair = state.characters.slice(0, 2).map((character) => character.id);
      rerender();
    }
  }

  function setCharacters(characters = []) {
    state.characters = characters;
    if (!state.selectedPair.length) state.selectedPair = state.characters.slice(0, 2).map((character) => character.id);
  }

  function render(container, page) {
    state.container = container;
    state.page = page;
    rerender();
  }

  function rerender() {
    if (!state.container) return;
    if (!state.loaded) {
      state.container.innerHTML = `<section class="knowledge-ingestion-status"><p class="eyebrow">Knowledge Sources</p><h1>Loading source database...</h1></section>`;
      return;
    }
    const store = combinedStore();
    const notes = filteredKnowledge(store.extractedKnowledge);
    state.container.innerHTML = `
      <section class="knowledge-ingestion" aria-labelledby="knowledgeSourcesTitle">
        <header class="knowledge-ingestion-hero">
          <div>
            <p class="eyebrow">Admin · Knowledge Sources</p>
            <h1 id="knowledgeSourcesTitle">${escapeHtml(state.page?.title || "Knowledge Sources")}</h1>
            <p>Import transcripts and written notes, keep raw source data intact, and generate source-backed draft knowledge for characters, teams, concepts, Fuses, and matchups.</p>
          </div>
          <dl>
            <div><dt>Sources</dt><dd>${store.sources.length}</dd></div>
            <div><dt>Extracted Notes</dt><dd>${store.extractedKnowledge.length}</dd></div>
            <div><dt>Characters</dt><dd>${state.characters.length}</dd></div>
          </dl>
        </header>

        ${state.error ? `<p class="knowledge-message">${escapeHtml(state.error)} Local database remains available.</p>` : ""}

        <section class="knowledge-workflow" aria-label="Knowledge ingestion workflow">
          ${["Source", "Transcript", "AI Extraction", "Review", "Character / Team Pages"].map((step, index) => `<article><span>${index + 1}</span><strong>${step}</strong></article>`).join("")}
        </section>

        <details class="knowledge-source-form" open>
          <summary>Add Knowledge Source</summary>
          ${sourceFormMarkup()}
        </details>

        <section class="knowledge-dashboard-grid">
          <article class="knowledge-panel knowledge-panel--wide">
            <div class="knowledge-panel-heading">
              <div><p class="eyebrow">Global Search</p><h2>Characters, Teams, Concepts, Sources</h2></div>
              <button class="platform-action platform-action--secondary" type="button" data-knowledge-export>Export Database</button>
            </div>
            ${filterMarkup()}
            <div class="knowledge-results">
              ${notes.length ? notes.map(knowledgeNoteMarkup).join("") : `<article class="knowledge-note"><strong>No extracted notes match.</strong><p>Add a transcript or adjust the filters.</p></article>`}
            </div>
          </article>

          <article class="knowledge-panel">
            <div class="knowledge-panel-heading"><div><p class="eyebrow">Source Queue</p><h2>Raw Sources</h2></div></div>
            <div class="knowledge-source-list">
              ${store.sources.length ? store.sources.slice(0, 8).map(sourceCardMarkup).join("") : `<p class="empty-state">No knowledge sources imported yet.</p>`}
            </div>
          </article>
        </section>

        <section class="knowledge-panel knowledge-panel--wide">
          <div class="knowledge-panel-heading"><div><p class="eyebrow">Team Synergy Pages</p><h2>Champion Pair Knowledge</h2></div></div>
          ${pairExplorerMarkup(store.extractedKnowledge)}
        </section>
      </section>
    `;
  }

  function sourceFormMarkup() {
    return `
      <form id="knowledgeSourceForm" class="knowledge-source-grid">
        <label><span>Source Type</span><select name="sourceType">${sourceTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}</select></label>
        <label><span>Title</span><input name="title" required placeholder="Sajam Slam notes, guide transcript, tournament recap" /></label>
        <label class="wide-field"><span>Source URL</span><input name="sourceUrl" type="url" placeholder="https://youtube.com/... or source link" /></label>
        <label><span>Characters Mentioned</span><input name="characters" placeholder="Ahri, Teemo, Yasuo" /></label>
        <label><span>Patch Version</span><input name="patchVersion" placeholder="Alpha Lab 2, Season 0, 2026-06 build" /></label>
        <label class="wide-field"><span>Transcript Text</span><textarea name="transcriptText" rows="9" required placeholder="Paste transcript text, community notes, tournament notes, Discord export text, Reddit export text, or manual notes here."></textarea></label>
        <div class="knowledge-form-actions wide-field">
          <p>Submission stores the raw source first, then creates separate extracted draft notes with source attribution.</p>
          <button class="platform-action" type="submit">Submit And Extract</button>
        </div>
      </form>
    `;
  }

  function filterMarkup() {
    const characterOptions = [["all", "All characters"], ...state.characters.map((character) => [character.id, character.name])];
    const kindOptions = [["all", "All knowledge"], ...knowledgeKinds];
    const sourceOptions = [["all", "All source types"], ...sourceTypes.map((type) => [type, type])];
    return `
      <div class="knowledge-filters">
        <label><span>Search</span><input type="search" value="${escapeHtml(state.filters.query)}" data-knowledge-filter="query" placeholder="Ahri Teemo neutral fuse source" /></label>
        ${selectMarkup("Character", "character", characterOptions, state.filters.character)}
        ${selectMarkup("Kind", "kind", kindOptions, state.filters.kind)}
        ${selectMarkup("Source Type", "sourceType", sourceOptions, state.filters.sourceType)}
      </div>
    `;
  }

  function selectMarkup(label, key, options, selected) {
    return `<label><span>${escapeHtml(label)}</span><select data-knowledge-filter="${escapeHtml(key)}">${options.map(([value, text]) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></label>`;
  }

  function knowledgeNoteMarkup(note) {
    const source = note.sourceRefs?.[0] || {};
    return `
      <details class="knowledge-note">
        <summary>
          <span>${escapeHtml(kindLabel(note.kind))}</span>
          <strong>${escapeHtml(note.title)}</strong>
        </summary>
        <p>${escapeHtml(note.body)}</p>
        ${note.characters?.length ? `<div class="knowledge-chip-list">${note.characters.map((id) => `<span>${escapeHtml(characterName(id))}</span>`).join("")}</div>` : ""}
        ${note.pair?.length === 2 ? `<p class="knowledge-pair-label">${escapeHtml(pairLabel(note.pair))}</p>` : ""}
        <dl class="knowledge-source-attribution">
          <div><dt>Source title</dt><dd>${escapeHtml(source.title || "Source title pending")}</dd></div>
          <div><dt>Source URL</dt><dd>${source.url ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Open source</a>` : "No URL stored"}</dd></div>
          <div><dt>Date added</dt><dd>${escapeHtml(source.dateAdded || note.createdAt || "Date pending")}</dd></div>
        </dl>
      </details>
    `;
  }

  function sourceCardMarkup(source) {
    return `
      <article class="knowledge-source-card">
        <span>${escapeHtml(source.type)}</span>
        <strong>${escapeHtml(source.title)}</strong>
        <p>${escapeHtml(source.patchVersion || "Patch not specified")} · ${escapeHtml(source.dateAdded || "Date pending")}</p>
        ${source.characters?.length ? `<div class="knowledge-chip-list">${source.characters.map((id) => `<span>${escapeHtml(characterName(id))}</span>`).join("")}</div>` : ""}
      </article>
    `;
  }

  function pairExplorerMarkup(notes) {
    const pair = state.selectedPair.length === 2 ? state.selectedPair : state.characters.slice(0, 2).map((character) => character.id);
    const pairNotes = recordsForPair(pair[0], pair[1], notes);
    return `
      <div class="knowledge-pair-picker">
        ${selectMarkup("First Champion", "pairA", state.characters.map((character) => [character.id, character.name]), pair[0] || "")}
        ${selectMarkup("Second Champion", "pairB", state.characters.map((character) => [character.id, character.name]), pair[1] || "")}
      </div>
      <div class="knowledge-synergy-grid">
        ${synergyFields.map(([field, label]) => {
          const fieldNotes = pairNotes.filter((note) => note.synergyField === field || note.tags?.includes(field));
          return `
            <section>
              <h3>${escapeHtml(label)}</h3>
              ${fieldNotes.length ? fieldNotes.map(knowledgeNoteMarkup).join("") : `<p>Research In Progress</p>`}
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  function filteredKnowledge(notes) {
    const query = state.filters.query.trim().toLowerCase();
    return notes.filter((note) => {
      const source = note.sourceRefs?.[0] || {};
      const haystack = [note.title, note.body, note.kind, source.title, source.url, ...(note.characters || []).map(characterName), ...(note.tags || [])].join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (state.filters.kind === "all" || note.kind === state.filters.kind)
        && (state.filters.character === "all" || note.characters?.includes(state.filters.character) || note.pair?.includes(state.filters.character))
        && (state.filters.sourceType === "all" || note.sourceType === state.filters.sourceType);
    });
  }

  function submitSource(form) {
    const values = new FormData(form);
    const today = new Date().toISOString().slice(0, 10);
    const source = normalizeSource({
      id: `local-source-${Date.now()}`,
      type: values.get("sourceType"),
      title: values.get("title"),
      url: values.get("sourceUrl"),
      characters: parseCharacterIds(values.get("characters"), values.get("transcriptText")),
      patchVersion: values.get("patchVersion"),
      transcriptText: values.get("transcriptText"),
      dateAdded: today,
      origin: "manual-entry",
    });
    const extracted = extractKnowledge(source);
    state.local.sources = [source, ...state.local.sources.filter((item) => item.id !== source.id)];
    state.local.extractedKnowledge = [...extracted, ...state.local.extractedKnowledge];
    saveLocalStore();
    form.reset();
    rerender();
    document.dispatchEvent(new CustomEvent("fg-lab:2xko-knowledge-updated"));
  }

  function extractKnowledge(source) {
    const sentences = splitSentences(source.transcriptText);
    const characters = source.characters.length ? source.characters : parseCharacterIds("", source.transcriptText);
    const refs = [{ sourceId: source.id, title: source.title, url: source.url, dateAdded: source.dateAdded }];
    const notes = [];
    for (const characterId of characters) {
      const related = sentences.filter((sentence) => sentenceIncludesCharacter(sentence, characterId)).slice(0, 3);
      notes.push(noteRecord({
        source,
        refs,
        kind: "character-summary",
        title: `${characterName(characterId)} source summary`,
        body: related.length ? related.join(" ") : `${characterName(characterId)} was mentioned in this source. Manual review should promote exact claims after checking context.`,
        characters: [characterId],
        tags: ["overview"],
      }));
    }
    const pairs = characterPairs(characters);
    for (const pair of pairs) {
      const related = sentences.filter((sentence) => pair.every((id) => sentenceIncludesCharacter(sentence, id))).slice(0, 2);
      const pairBody = related.length ? related.join(" ") : `${pairLabel(pair)} appeared in the same source. Treat as a team research lead until reviewed.`;
      notes.push(noteRecord({ source, refs, kind: "synergy-note", title: `${pairLabel(pair)} synergy lead`, body: pairBody, characters: pair, pair, tags: ["neutral-synergy"], synergyField: "neutral-synergy" }));
      notes.push(noteRecord({ source, refs, kind: "team-recommendation", title: `${pairLabel(pair)} team research lead`, body: `Review this source for the team's win condition, support pattern, and Fuse fit before publishing a recommendation.`, characters: pair, pair, tags: ["win-condition"], synergyField: "win-condition" }));
    }
    pushConcept(notes, source, refs, "neutral-concept", "Neutral concepts", sentences, ["neutral", "space", "approach", "screen", "poke", "whiff", "zoning", "assist cover"], characters);
    pushConcept(notes, source, refs, "combo-concept", "Combo concepts", sentences, ["combo", "route", "conversion", "tag", "launcher", "damage", "corner", "oki"], characters);
    pushConcept(notes, source, refs, "fuse-discussion", "Fuse discussions", sentences, ["fuse", "freestyle", "double down", "2x assist", "fury", "pulse", "sidekick"], characters);
    pushConcept(notes, source, refs, "matchup-discussion", "Matchup discussions", sentences, ["matchup", "punish", "counter", "anti", "struggle", "beats", "loses"], characters);
    return notes;
  }

  function pushConcept(notes, source, refs, kind, label, sentences, keywords, characters) {
    const matches = sentences.filter((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword))).slice(0, 3);
    if (!matches.length) return;
    notes.push(noteRecord({ source, refs, kind, title: `${label} from ${source.title}`, body: matches.join(" "), characters, tags: keywords.slice(0, 4) }));
  }

  function noteRecord({ source, refs, kind, title, body, characters = [], pair = [], tags = [], synergyField = "" }) {
    return {
      id: `${kind}-${source.id}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      title,
      body,
      characters: unique(characters),
      pair: pair.length === 2 ? pair : [],
      tags: unique(tags),
      synergyField,
      sourceType: source.type,
      sourceRefs: refs,
      status: "draft-ai-extraction",
      confidence: "Draft",
      createdAt: source.dateAdded,
    };
  }

  function recordsForCharacter(characterId, notes = combinedStore().extractedKnowledge) {
    return notes.filter((note) => note.characters?.includes(characterId) || note.pair?.includes(characterId));
  }

  function recordsForPair(a, b, notes = combinedStore().extractedKnowledge) {
    const pair = [a, b].sort().join("|");
    return notes.filter((note) => note.pair?.length === 2 && note.pair.slice().sort().join("|") === pair);
  }

  function groupedCharacterKnowledge(characterId) {
    const notes = recordsForCharacter(characterId);
    return {
      overview: notes.filter((note) => note.kind === "character-summary"),
      strengths: notes.filter((note) => note.tags?.includes("strength")),
      weaknesses: notes.filter((note) => note.tags?.includes("weakness")),
      partners: notes.filter((note) => ["synergy-note", "team-recommendation"].includes(note.kind)),
      teams: notes.filter((note) => note.kind === "team-recommendation"),
      neutral: notes.filter((note) => note.kind === "neutral-concept" || note.tags?.includes("neutral-synergy")),
      combo: notes.filter((note) => note.kind === "combo-concept" || note.tags?.includes("combo-synergy")),
      matchup: notes.filter((note) => note.kind === "matchup-discussion"),
      sources: unique(notes.flatMap((note) => note.sourceRefs || []).map((source) => source.sourceId)).map((sourceId) => notes.flatMap((note) => note.sourceRefs || []).find((source) => source.sourceId === sourceId)),
    };
  }

  function normalizeStore(data) {
    return {
      sources: (data.sources || []).map(normalizeSource),
      extractedKnowledge: (data.extractedKnowledge || []).map(normalizeKnowledge),
    };
  }

  function normalizeSource(source) {
    return {
      id: String(source.id || `source-${Date.now()}`),
      type: sourceTypes.includes(source.type) ? source.type : "Manual Notes",
      title: String(source.title || "Untitled Source").trim(),
      url: safeUrl(source.url || source.sourceUrl),
      characters: unique(source.characters || []),
      patchVersion: String(source.patchVersion || "").trim(),
      transcriptText: String(source.transcriptText || source.rawText || "").trim(),
      dateAdded: source.dateAdded || new Date().toISOString().slice(0, 10),
      origin: source.origin || "manual-entry",
      metadata: source.metadata || {},
    };
  }

  function normalizeKnowledge(note) {
    return {
      id: String(note.id || `note-${Date.now()}`),
      kind: note.kind || "character-summary",
      title: String(note.title || "Untitled Note").trim(),
      body: String(note.body || "").trim(),
      characters: unique(note.characters || []),
      pair: unique(note.pair || []),
      tags: unique(note.tags || []),
      synergyField: note.synergyField || "",
      sourceType: note.sourceType || "",
      sourceRefs: Array.isArray(note.sourceRefs) ? note.sourceRefs : [],
      status: note.status || "draft-ai-extraction",
      confidence: note.confidence || "Draft",
      createdAt: note.createdAt || "",
    };
  }

  function combinedStore() {
    const sources = [...new Map([...state.local.sources, ...state.seed.sources].map((source) => [source.id, source])).values()];
    const extractedKnowledge = [...new Map([...state.local.extractedKnowledge, ...state.seed.extractedKnowledge].map((note) => [note.id, note])).values()];
    return { sources, extractedKnowledge };
  }

  function loadLocalStore() {
    try {
      return normalizeStore(JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch {
      return { sources: [], extractedKnowledge: [] };
    }
  }

  function saveLocalStore() {
    localStorage.setItem(storageKey, JSON.stringify(state.local));
  }

  function parseCharacterIds(raw, text) {
    const value = `${raw || ""} ${text || ""}`.toLowerCase();
    return state.characters.filter((character) => value.includes(character.name.toLowerCase()) || value.includes(character.id.toLowerCase())).map((character) => character.id);
  }

  function sentenceIncludesCharacter(sentence, characterId) {
    const character = state.characters.find((item) => item.id === characterId);
    const value = sentence.toLowerCase();
    return value.includes(characterId.toLowerCase()) || (character && value.includes(character.name.toLowerCase()));
  }

  function splitSentences(text) {
    return String(text || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 12);
  }

  function characterPairs(characters) {
    const pairs = [];
    for (let i = 0; i < characters.length; i += 1) {
      for (let j = i + 1; j < characters.length; j += 1) pairs.push([characters[i], characters[j]]);
    }
    return pairs;
  }

  function pairLabel(pair) {
    return pair.map(characterName).join(" + ");
  }

  function characterName(id) {
    return state.characters.find((character) => character.id === id)?.name || titleCase(id);
  }

  function kindLabel(kind) {
    return knowledgeKinds.find(([value]) => value === kind)?.[1] || titleCase(kind);
  }

  function titleCase(value) {
    return String(value || "").split("-").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "").join(" ");
  }

  function unique(items) {
    return [...new Set((Array.isArray(items) ? items : String(items || "").split(",")).map((item) => String(item || "").trim()).filter(Boolean))];
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function exportStore() {
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      sources: combinedStore().sources,
      extractedKnowledge: combinedStore().extractedKnowledge,
    };
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "2xko-knowledge-store.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "knowledgeSourceForm") return;
    event.preventDefault();
    submitSource(event.target);
  });

  document.addEventListener("input", (event) => {
    const key = event.target.dataset.knowledgeFilter;
    if (!key) return;
    if (key === "pairA") state.selectedPair[0] = event.target.value;
    else if (key === "pairB") state.selectedPair[1] = event.target.value;
    else state.filters[key] = event.target.value;
    rerender();
  });

  document.addEventListener("change", (event) => {
    const key = event.target.dataset.knowledgeFilter;
    if (!key) return;
    if (key === "pairA") state.selectedPair[0] = event.target.value;
    else if (key === "pairB") state.selectedPair[1] = event.target.value;
    else state.filters[key] = event.target.value;
    rerender();
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-knowledge-export]")) exportStore();
  });

  window.FG_LAB_2XKO_KNOWLEDGE = {
    load,
    render,
    setCharacters,
    recordsForCharacter,
    recordsForPair,
    groupedCharacterKnowledge,
    combinedStore,
  };
})();
