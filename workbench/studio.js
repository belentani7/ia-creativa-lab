"use strict";

const state = { items: [], filter: "all", query: "" };
const byId = id => document.getElementById(id);
const element = (tag, value, cls = "") => {
  const el = document.createElement(tag);
  if (value !== undefined) el.textContent = value;
  if (cls) el.className = cls;
  return el;
};
const normalize = raw => String(raw || "").toLocaleLowerCase("es").normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");
const fromManifest = raw => {
  if (!raw || raw.schema_version !== 1 || raw.distributable !== false ||
      !Array.isArray(raw.snapshots) || raw.snapshots.length !== 24) {
    throw new Error("Invalid private archive registry");
  }
  const seen = new Set();
  return raw.snapshots.map(item => {
    if (!item || typeof item.id !== "string" || item.id.length > 100 ||
        !/^[a-z0-9-]+$/.test(item.id) ||
        typeof item.historical_description !== "string" || item.historical_description.length > 2000 ||
        typeof item.historical_site !== "string" || item.historical_site.length > 300 ||
        !Number.isSafeInteger(item.historical_size_kb) ||
        item.historical_size_kb < 0 || item.historical_size_kb > 1_000_000 ||
        item.original_repository !== item.id ||
        item.snapshot_path !== "legacy/" + item.id + "/" ||
        typeof item.entrypoint_path !== "string" ||
        !item.entrypoint_path.startsWith(item.snapshot_path) ||
        !/^legacy\/[a-z0-9-]+\/[a-zA-Z0-9_./-]+$/.test(item.entrypoint_path) ||
        item.entrypoint_path.includes("..") ||
        !["private", "public"].includes(item.historical_visibility) ||
        seen.has(item.id)) {
      throw new Error("Invalid independent project identity");
    }
    seen.add(item.id);
    return item;
  });
};

const visibleRecords = () => state.items.filter(item => {
  const visibility = state.filter === "all" || item.historical_visibility === state.filter;
  const text = normalize([item.id, item.historical_description, item.snapshot_path].join(" "));
  return visibility && (!state.query || text.includes(state.query));
});

function card(item, order) {
  const box = element("article", undefined, "card");
  const meta = element("div", undefined, "card-top");
  meta.append(element("span", String(order + 1).padStart(2, "0") + " / ARCHIVO", "card-number"));
  const badge = element("span", item.historical_visibility === "private" ?
    "PRIVADO · HISTÓRICO" : "PÚBLICO · HISTÓRICO", "tag " + item.historical_visibility);
  badge.title = "Visibilidad registrada en el inventario original; no confirma la visibilidad actual.";
  meta.append(badge);
  box.append(meta);
  box.append(element("h3", item.id.replaceAll("-", " ")));
  box.append(element("p", item.historical_description || "Sin descripción histórica aportada."));
  const foot = element("div", undefined, "card-foot");
  foot.append(element("span", item.historical_size_kb + " KB · TAMAÑO HISTÓRICO"));
  const open = element("a", "Consultar origen ↗");
  open.href = "./" + item.entrypoint_path;
  // Legacy HTML may contain active, untrusted scripts: download the source instead of executing it in this origin.
  open.download = item.entrypoint_path.split("/").at(-1);
  open.setAttribute("aria-label", "Descargar archivo fuente original de " + item.id);
  foot.append(open);
  box.append(foot);
  return box;
}

function render() {
  const matches = visibleRecords();
  const container = byId("cards");
  container.replaceChildren();
  const fragment = document.createDocumentFragment();
  const numbers = new Map(state.items.map((row, i) => [row.id, i]));
  for (const item of matches) fragment.append(card(item, numbers.get(item.id) ?? 0));
  container.append(fragment);
  if (!matches.length) container.append(element("p", "Sin coincidencias. Cambia el filtro o la búsqueda. Ningún proyecto se ha eliminado.", "empty"));
  byId("resultCount").textContent = matches.length + " de " + state.items.length + " identidades visibles";
}

function updateFilter(filter) {
  if (!["all", "private", "public"].includes(filter)) return;
  state.filter = filter;
  for (const button of document.querySelectorAll("[data-filter]")) {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  render();
}

function applyManifest(items) {
  state.items = items;
  byId("total").textContent = String(items.length);
  byId("historicalPrivate").textContent = String(items.filter(
    item => item.historical_visibility === "private").length);
  byId("historicalPublic").textContent = String(items.filter(
    item => item.historical_visibility === "public").length);
  render();
}

async function main() {
  for (const button of document.querySelectorAll("[data-filter]")) {
    button.addEventListener("click", () => updateFilter(button.dataset.filter));
  }
  const query = byId("query");
  query.addEventListener("input", event => {
    state.query = normalize(event.target.value.trim());
    render();
  });

  const picker = byId("catalogFile");
  // File picker works when index.html is opened offline without a local HTTP server.
  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    picker.value = "";
    if (!file) return;
    try {
      if (file.size > 256_000) throw new Error("Manifest too large");
      const parsed = fromManifest(JSON.parse(await file.text()));
      applyManifest(parsed);
      byId("error").hidden = true;
    } catch {
      byId("error").hidden = false;
      byId("resultCount").textContent = state.items.length
        ? "El archivo local no es válido; se conserva el catálogo anterior."
        : "El archivo local no contiene un inventario privado válido.";
    }
  });

  try {
    const response = await fetch("./catalog.json", {cache: "no-store", credentials: "omit"});
    if (!response.ok) throw new Error("Manifest not available");
    applyManifest(fromManifest(await response.json()));
  } catch {
    byId("resultCount").textContent = "Inventario no disponible desde esta dirección";
    byId("error").hidden = false;
  }
}

main();
