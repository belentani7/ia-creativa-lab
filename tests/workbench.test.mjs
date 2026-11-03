import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(".");
const catalog = JSON.parse(readFileSync(resolve(root, "catalog.json"), "utf8"));
const html = readFileSync(resolve(root, "index.html"), "utf8");
const js = readFileSync(resolve(root, "workbench/studio.js"), "utf8");

test("keep exactly 24 independent original snapshots, with no additions by conversation", () => {
  assert.equal(catalog.schema_version, 1);
  assert.equal(catalog.distributable, false);
  assert.equal(catalog.snapshots.length, 24);
  assert.equal(new Set(catalog.snapshots.map(x => x.id)).size, 24);
  const actual = readdirSync(resolve(root,"legacy"), { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(x => x.name).sort();
  assert.deepEqual(actual, catalog.snapshots.map(x => x.id).sort());
});

test("every archive card resolves to an existing local file within its original project", () => {
  for (const item of catalog.snapshots) {
    assert.equal(item.original_repository, item.id);
    assert.match(item.id, /^[a-z0-9-]+$/);
    assert.equal(item.snapshot_path, "legacy/" + item.id + "/");
    assert.ok(item.entrypoint_path.startsWith(item.snapshot_path));
    assert.ok(!item.entrypoint_path.includes(".."));
    assert.ok(existsSync(resolve(root, item.entrypoint_path)), item.entrypoint_path);
    assert.ok(statSync(resolve(root, item.entrypoint_path)).isFile());
    assert.ok(typeof item.historical_description === "string");
    assert.ok(["private", "public"].includes(item.historical_visibility));
  }
});

test("visibility numbers remain historical, not current claims", () => {
  assert.equal(catalog.snapshots.filter(x => x.historical_visibility === "private").length, 11);
  assert.equal(catalog.snapshots.filter(x => x.historical_visibility === "public").length, 13);
  assert.match(catalog.visibility_warning, /not current permissions/);
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /NO PUBLICACIÓN/);
  assert.doesNotMatch(html, /googleapis|cdn\.jsdelivr|<iframe/);
});

test("real search and filtering preserve identity and never inject HTML", () => {
  assert.match(html, /id="cards"/);
  assert.match(html, /id="query"/);
  assert.match(html, /data-filter="private"/);
  assert.match(html, /data-filter="public"/);
  assert.match(js, /state\.items\.filter/);
  assert.match(js, /entrypoint_path/);
  assert.match(js, /createElement/);
  assert.match(js, /replaceChildren/);
  assert.doesNotMatch(js, /\.innerHTML\s*=/);
  assert.doesNotMatch(js, /\.eval\(|new Function\(/);
  assert.match(html, /href="#catalog"/);
});

test("local manifest import and source downloads work without serving legacy HTML", () => {
  assert.match(html, /id="catalogFile" type="file"/);
  assert.match(js, /file\.size > 256_000/);
  assert.match(js, /await file\.text\(\)/);
  assert.match(js, /applyManifest\(parsed\)/);
  assert.match(js, /open\.download = item\.entrypoint_path\.split/);
  assert.match(js, /se conserva el catálogo anterior/);
  assert.doesNotMatch(js, /window\.open\(/);
});
