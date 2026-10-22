import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const src=readFileSync(new URL("../workbench/studio.js",import.meta.url),"utf8");
const catalog=JSON.parse(readFileSync(new URL("../catalog.json",import.meta.url),"utf8"));
const start=src.indexOf("const fromManifest = raw =>");
const end=src.indexOf("const visibleRecords = ",start);
assert.ok(start>=0&&end>start);
const validate=runInNewContext(src.slice(start,end)+";fromManifest",{},{timeout:1500});
const copy=()=>JSON.parse(JSON.stringify(catalog));

test("accepts only the actual 24 separate historical snapshots",()=>{
 const items=validate(copy());
 assert.equal(items.length,24);
 assert.equal(new Set(items.map(x=>x.id)).size,24);
});
test("rejects identity and path traversal for all imported entries",()=>{
 for(const patch of [
   {id:"../other"},
   {snapshot_path:"legacy/other/"},
   {entrypoint_path:"legacy/firelab/../../index.html"},
   {entrypoint_path:"legacy/firelab/README.md?script=1"},
   {original_repository:"different"},
 ]) {
   const doc=copy();Object.assign(doc.snapshots[0],patch);
   assert.throws(()=>validate(doc),undefined,JSON.stringify(patch));
 }
});
test("rejects disguised private status and invalid archive sizes",()=>{
 for(const patch of [
   {historical_visibility:"newly-public"},
   {historical_size_kb:NaN},
   {historical_size_kb:-1},
   {historical_size_kb:1_000_001},
   {historical_size_kb:"100"},
   {historical_site:3},
 ]) {
   const doc=copy();Object.assign(doc.snapshots[0],patch);
   assert.throws(()=>validate(doc),undefined,JSON.stringify(patch));
 }
});
test("bounds untrusted text and refuses tampered distribution flag",()=>{
 for(const patch of [
   {historical_description:"x".repeat(2001)},
   {historical_description:{}},
   {historical_site:"x".repeat(301)},
 ]) {
   const doc=copy();Object.assign(doc.snapshots[0],patch);
   assert.throws(()=>validate(doc));
 }
 const doc=copy();doc.distributable=true;
 assert.throws(()=>validate(doc));
});
