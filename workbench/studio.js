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
    if (!item || typeof item.id !== "string" ||
        !/^[a-z0-9-]+$/.test(item.id) ||
        item.original_repository !== item.id ||
        item.snapshot_path !== "legacy/" + item.id + "/" ||
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
  open.href = "./" + item.snapshot_path + "README.md";
  open.setAttribute("aria-label", "Abrir README histórico de " + item.id);
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

async function main() {
  for (const button of document.querySelectorAll("[data-filter]")) {
    button.addEventListener("click", () => updateFilter(button.dataset.filter));
  }
  const query = byId("query");
  query.addEventListener("input", event => {
    state.query = normalize(event.target.value.trim());
    render();
  });

  try {
    const response = await fetch("./catalog.json", {cache: "no-store", credentials: "omit"});
    if (!response.ok) throw new Error("Manifest not available");
    state.items = fromManifest(await response.json());
    byId("total").textContent = String(state.items.length);
    byId("historicalPrivate").textContent = String(state.items.filter(
      item => item.historical_visibility === "private").length);
    byId("historicalPublic").textContent = String(state.items.filter(
      item => item.historical_visibility === "public").length);
    render();
  } catch {
    byId("resultCount").textContent = "Inventario indisponible desde esta dirección";
    byId("error").hidden = false;
  }
}

main();
