(() => {
  const storageKey = "fg-lab:2xko-research-vault:v2";
  const legacyStorageKey = "fg-lab:2xko-research-vault:v1";
  const sourceTypes = ["YouTube", "Discord", "Stream", "Tournament", "Personal Notes"];
  const confidenceLevels = ["Low", "Medium", "High"];
  const statuses = [
    ["draft", "Draft"],
    ["needs-review", "Needs Review"],
    ["approved", "Approved"],
  ];
  const state = {
    container: null,
    page: null,
    seedRecords: [],
    localRecords: [],
    loaded: false,
    error: "",
    filters: { query: "", source: "all", status: "all", confidence: "all", tag: "all" },
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function load(game) {
    state.localRecords = loadLocalRecords();
    try {
      const file = game?.dataFiles?.researchVault || "research-vault.json";
      const root = String(game?.dataRoot || "/public/data/2xko").replace(/\/$/, "");
      const source = window.FG_LAB_ASSET_PATH?.(`${root}/${file}`) || `${root}/${file}`;
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Research data returned HTTP ${response.status}.`);
      const data = await response.json();
      state.seedRecords = (data.records || []).map(normalizeRecord);
    } catch (error) {
      state.error = error.message || "Seed research data could not be loaded.";
    } finally {
      state.loaded = true;
      rerender();
    }
  }

  function render(container, page) {
    state.container = container;
    state.page = page;
    rerender();
  }

  function rerender() {
    if (!state.container) return;
    if (!state.loaded) {
      state.container.innerHTML = `<section class="vault-status"><p class="eyebrow">Internal Research</p><h1>Loading Research Vault...</h1></section>`;
      return;
    }

    const records = allRecords();
    const approvedPairs = exportableRecords().length;
    state.container.innerHTML = `
      <section class="research-vault-workspace" aria-labelledby="vaultTitle">
        <header class="vault-heading">
          <div>
            <p class="eyebrow">Internal Collection Workspace</p>
            <h1 id="vaultTitle">${escapeHtml(state.page?.title || "2XKO Research Vault")}</h1>
            <p>Capture the source, review the claim, then promote approved evidence into the synergy database.</p>
          </div>
          <span class="vault-internal-badge">Local JSON workflow</span>
        </header>

        <ol class="vault-workflow" aria-label="Research workflow">
          ${["Source", "Research Entry", "Review", "Approve", "Synergy Database"].map((item, index) => `<li><span>${index + 1}</span>${item}</li>`).join("")}
        </ol>

        ${state.error ? `<p class="vault-message vault-message--warning">${escapeHtml(state.error)} Local drafts remain available.</p>` : ""}

        <details class="vault-capture" open>
          <summary>Quick Add Entry</summary>
          ${captureFormMarkup()}
        </details>

        <section class="vault-filter-panel" aria-labelledby="vaultFilterTitle">
          <div class="vault-filter-heading">
            <div><p class="eyebrow">Research queue</p><h2 id="vaultFilterTitle">Find and review evidence</h2></div>
            <div class="vault-export-actions">
              <button class="platform-action platform-action--secondary" type="button" data-vault-export>Export Vault</button>
              <button class="platform-action" type="button" data-vault-export-synergies ${approvedPairs ? "" : "disabled"}>Export Synergies (${approvedPairs})</button>
            </div>
          </div>
          <div class="vault-filters">
            <label><span>Search</span><input type="search" value="${escapeHtml(state.filters.query)}" placeholder="Character, partner, Fuse, notes" data-vault-filter="query" /></label>
            ${selectMarkup("Source", "source", [["all", "All sources"], ...sourceTypes.map((item) => [item, item])], state.filters.source)}
            ${selectMarkup("Stage", "status", [["all", "All stages"], ...statuses], state.filters.status)}
            ${selectMarkup("Confidence", "confidence", [["all", "All confidence"], ...confidenceLevels.map((item) => [item, item])], state.filters.confidence)}
            ${selectMarkup("Tag", "tag", [["all", "All tags"], ...availableTags(records).map((item) => [item, item])], state.filters.tag)}
          </div>
        </section>

        <section class="vault-results-section" aria-labelledby="vaultResultsTitle">
          <div class="vault-results-heading"><h2 id="vaultResultsTitle">Research entries</h2><span id="vaultResultCount"></span></div>
          <div id="vaultResults" class="research-vault-list"></div>
        </section>
      </section>
    `;
    updateResults();
  }

  function captureFormMarkup() {
    const now = new Date();
    const localTimestamp = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    return `
      <form id="vaultCaptureForm" class="vault-capture-form">
        <label><span>Character</span><input name="character" required placeholder="Yasuo" /></label>
        <label><span>Partner</span><input name="partner" placeholder="Ahri (required for synergy export)" /></label>
        <label><span>Fuse</span><input name="fuse" placeholder="Optional Fuse" /></label>
        <label><span>Timestamp</span><input name="timestamp" type="datetime-local" value="${localTimestamp}" /></label>
        ${selectMarkup("Source", "sourceType", sourceTypes.map((item) => [item, item]), sourceTypes[0], false)}
        ${selectMarkup("Confidence", "confidence", confidenceLevels.map((item) => [item, item]), "Medium", false)}
        <label class="vault-field-wide"><span>Source Link</span><input name="sourceLink" type="url" placeholder="https://..." /></label>
        <label class="vault-field-wide"><span>Notes</span><textarea name="notes" rows="4" required placeholder="What was shown, claimed, or tested? Keep the observation separate from your conclusion."></textarea></label>
        <label class="vault-field-wide"><span>Tags</span><input name="tags" placeholder="Pressure, Tag Routes, Anti-Zoner" /></label>
        <div class="vault-form-actions vault-field-wide">
          <p>New entries start as drafts and stay in this browser until exported.</p>
          <button class="platform-action" type="submit">Add Draft</button>
        </div>
      </form>
    `;
  }

  function selectMarkup(label, key, options, selected, filter = true) {
    const attribute = filter ? `data-vault-filter="${key}"` : `name="${key}"`;
    return `<label><span>${escapeHtml(label)}</span><select ${attribute}>${options.map(([value, text]) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></label>`;
  }

  function updateResults() {
    const results = state.container?.querySelector("#vaultResults");
    const count = state.container?.querySelector("#vaultResultCount");
    if (!results || !count) return;
    const records = filteredRecords();
    count.textContent = `${records.length} of ${allRecords().length}`;
    results.innerHTML = records.length
      ? records.map(recordMarkup).join("")
      : `<article class="research-record research-record--empty"><h2>No matching entries</h2><p>Adjust the search or filters.</p></article>`;
  }

  function recordMarkup(record) {
    const status = statuses.find(([value]) => value === record.verificationStatus)?.[1] || "Draft";
    const sourceLink = safeUrl(record.sourceLink);
    const canExport = record.verificationStatus === "approved" && record.character && record.partner;
    const context = [record.partner && `Partner: ${record.partner}`, record.fuse && `Fuse: ${record.fuse}`].filter(Boolean);
    return `
      <article class="research-record">
        <div class="research-record__header">
          <div><span>${escapeHtml(record.sourceType)}</span><h2>${escapeHtml(record.character)}</h2></div>
          <strong class="vault-verification vault-verification--${escapeHtml(record.verificationStatus)}">${escapeHtml(status)}</strong>
        </div>
        ${context.length ? `<div class="research-record__context">${context.map((item) => `<strong>${escapeHtml(item)}</strong>`).join("")}</div>` : ""}
        <p>${escapeHtml(record.notes)}</p>
        <div class="research-tags">${record.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <dl class="research-record__meta">
          <div><dt>Timestamp</dt><dd>${escapeHtml(formatTimestamp(record.timestamp))}</dd></div>
          <div><dt>Confidence</dt><dd>${escapeHtml(record.confidence)}</dd></div>
        </dl>
        <div class="vault-review-actions">
          ${record.verificationStatus === "draft" ? `<button type="button" data-vault-stage="needs-review" data-record-id="${escapeHtml(record.id)}">Send to Review</button>` : ""}
          ${record.verificationStatus === "needs-review" ? `<button type="button" data-vault-stage="draft" data-record-id="${escapeHtml(record.id)}">Return to Draft</button><button type="button" data-vault-stage="approved" data-record-id="${escapeHtml(record.id)}">Approve</button>` : ""}
          ${record.verificationStatus === "approved" ? `<button type="button" data-vault-stage="needs-review" data-record-id="${escapeHtml(record.id)}">Reopen Review</button>` : ""}
          ${canExport ? `<button type="button" data-vault-export-pair="${escapeHtml(record.id)}">Export Pair JSON</button>` : ""}
        </div>
        <footer class="vault-record-footer">
          <span>${record.local ? "Local entry" : "Seed entry"} · ${escapeHtml(record.updatedAt || record.createdAt || "Date pending")}</span>
          ${sourceLink ? `<a href="${escapeHtml(sourceLink)}" target="_blank" rel="noreferrer">Open source</a>` : `<span class="research-link-pending">Link pending</span>`}
        </footer>
      </article>
    `;
  }

  function filteredRecords() {
    const query = state.filters.query.trim().toLowerCase();
    return allRecords().filter((record) => {
      const haystack = [record.character, record.partner, record.fuse, record.sourceType, record.notes, ...record.tags].join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (state.filters.source === "all" || record.sourceType === state.filters.source)
        && (state.filters.status === "all" || record.verificationStatus === state.filters.status)
        && (state.filters.confidence === "all" || record.confidence === state.filters.confidence)
        && (state.filters.tag === "all" || record.tags.includes(state.filters.tag));
    });
  }

  function allRecords() {
    return [...new Map([...state.localRecords, ...state.seedRecords].map((record) => [record.id, record])).values()];
  }

  function availableTags(records) {
    return [...new Set(records.flatMap((record) => record.tags))].sort((a, b) => a.localeCompare(b));
  }

  function normalizeRecord(record, local = false) {
    const legacyStatus = record.verificationStatus === "verified" ? "approved" : record.verificationStatus === "unverified" ? "draft" : record.verificationStatus;
    return {
      id: String(record.id || `research-${Date.now()}`),
      character: String(record.character || "Unassigned").trim(),
      partner: String(record.partner || "").trim(),
      fuse: String(record.fuse || "").trim(),
      sourceType: String(record.sourceType || record.source || "Personal Notes").trim(),
      sourceLink: String(record.sourceLink || record.link || "").trim(),
      timestamp: String(record.timestamp || record.createdAt || "").trim(),
      notes: String(record.notes || "").trim(),
      tags: normalizeTags(record.tags),
      confidence: confidenceLevels.includes(record.confidence) ? record.confidence : "Medium",
      verificationStatus: statuses.some(([value]) => value === legacyStatus) ? legacyStatus : "draft",
      createdAt: record.createdAt || "",
      updatedAt: record.updatedAt || record.createdAt || "",
      local,
    };
  }

  function normalizeTags(value) {
    const tags = Array.isArray(value) ? value : String(value || "").split(",");
    return [...new Set(tags.map((tag) => tag.trim().replace(/\.+$/, "")).filter((tag) => tag && tag.length <= 32))];
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function formatTimestamp(value) {
    if (!value) return "Not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function loadLocalRecords() {
    try {
      const current = localStorage.getItem(storageKey);
      const legacy = localStorage.getItem(legacyStorageKey);
      return (JSON.parse(current || legacy || "[]") || []).map((record) => normalizeRecord(record, true));
    } catch {
      return [];
    }
  }

  function saveLocalRecords() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.localRecords.map(({ local, ...record }) => record)));
      return true;
    } catch {
      return false;
    }
  }

  function addRecord(form) {
    const values = new FormData(form);
    const today = new Date().toISOString().slice(0, 10);
    const record = normalizeRecord({
      id: `local-${Date.now()}`,
      character: values.get("character"),
      partner: values.get("partner"),
      fuse: values.get("fuse"),
      timestamp: values.get("timestamp"),
      sourceType: values.get("sourceType"),
      sourceLink: values.get("sourceLink"),
      notes: values.get("notes"),
      tags: values.get("tags"),
      confidence: values.get("confidence"),
      verificationStatus: "draft",
      createdAt: today,
      updatedAt: today,
    }, true);
    state.localRecords.unshift(record);
    if (!saveLocalRecords()) state.error = "This browser could not save the local entry.";
    rerender();
  }

  function setStage(id, verificationStatus) {
    const source = allRecords().find((record) => record.id === id);
    if (!source) return;
    const next = normalizeRecord({ ...source, verificationStatus, updatedAt: new Date().toISOString().slice(0, 10) }, true);
    state.localRecords = [next, ...state.localRecords.filter((record) => record.id !== id)];
    if (!saveLocalRecords()) state.error = "This browser could not save the review change.";
    rerender();
  }

  function exportRecords() {
    downloadJson("2xko-research-vault.json", {
      version: 3,
      updatedAt: new Date().toISOString(),
      records: allRecords().map(({ local, ...record }) => record),
    });
  }

  function exportableRecords() {
    return allRecords().filter((record) => record.verificationStatus === "approved" && record.character && record.partner);
  }

  function synergyRecord(records) {
    const team = [...new Set(records.flatMap((record) => [slugify(record.character), slugify(record.partner)]))].sort();
    return {
      team,
      rating: null,
      difficulty: null,
      playstyles: [],
      strengths: [],
      weaknesses: [],
      recommendedFuses: [...new Set(records.map((record) => record.fuse).filter(Boolean))],
      routes: [],
      notes: [...new Set(records.map((record) => record.notes).filter(Boolean))],
      sources: records.map((record) => ({
        researchId: record.id,
        type: record.sourceType,
        link: record.sourceLink,
        timestamp: record.timestamp,
        confidence: record.confidence,
        tags: record.tags,
      })),
      verified: false,
    };
  }

  function exportPair(id) {
    const selected = allRecords().find((record) => record.id === id);
    if (!selected) return;
    const pairId = pairSlug(selected);
    const records = exportableRecords().filter((record) => pairSlug(record) === pairId);
    downloadJson(`${pairId}.json`, synergyRecord(records));
  }

  function exportSynergies() {
    const grouped = Object.groupBy
      ? Object.groupBy(exportableRecords(), pairSlug)
      : exportableRecords().reduce((groups, record) => ({ ...groups, [pairSlug(record)]: [...(groups[pairSlug(record)] || []), record] }), {});
    const files = Object.entries(grouped).map(([id, records]) => ({ file: `${id}.json`, data: synergyRecord(records) }));
    downloadJson("2xko-approved-synergy-import.json", { version: 1, generatedAt: new Date().toISOString(), files });
  }

  function pairSlug(record) {
    return [slugify(record.character), slugify(record.partner)].sort().join("-");
  }

  function slugify(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function downloadJson(filename, payload) {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "vaultCaptureForm") return;
    event.preventDefault();
    addRecord(event.target);
  });

  document.addEventListener("input", (event) => {
    const key = event.target.dataset.vaultFilter;
    if (!key) return;
    state.filters[key] = event.target.value;
    updateResults();
  });

  document.addEventListener("change", (event) => {
    const key = event.target.dataset.vaultFilter;
    if (!key) return;
    state.filters[key] = event.target.value;
    updateResults();
  });

  document.addEventListener("click", (event) => {
    const stageButton = event.target.closest("[data-vault-stage]");
    if (stageButton) return setStage(stageButton.dataset.recordId, stageButton.dataset.vaultStage);
    const pairButton = event.target.closest("[data-vault-export-pair]");
    if (pairButton) return exportPair(pairButton.dataset.vaultExportPair);
    if (event.target.closest("[data-vault-export-synergies]")) return exportSynergies();
    if (event.target.closest("[data-vault-export]")) exportRecords();
  });

  window.FG_LAB_RESEARCH_VAULT = { load, render };
})();
