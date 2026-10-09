import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {estimateBudget} from "../lib/budget.mjs";

test("cost units and number of rooms",()=>{
 const p=estimateBudget({people:2,days:3,nights:2,rooms:1,transport:50000,
   roomNight:100000,foodDaily:25000,admissions:15000,localTransport:0,reserve:0});
 assert.equal(p.total,480000);
 assert.equal(p.price_status,"estimate");
});
test("one night with two rooms",()=>{
 const p=estimateBudget({people:4,days:2,nights:1,rooms:2,transport:0,
   roomNight:100000,foodDaily:0,admissions:0,localTransport:0,reserve:0});
 assert.equal(p.parts.lodging,200000);
});
test("negative or invalid money refused",()=>{
 assert.throws(()=>estimateBudget({people:1,days:1,nights:1,rooms:1,transport:-1,
   roomNight:0,foodDaily:0,admissions:0,localTransport:0,reserve:0}));
});
test("official verified seed records have provenance",()=>{
 const data=JSON.parse(readFileSync(new URL("../data/items.json",import.meta.url)));
 assert.equal(data.schema_version,1);
 assert.equal(data.items.length,3);
 assert.ok(data.items.every(x=>x.provenance==="official" && x.price_status==="unknown"));
});
test("public files must not expose private source details",()=>{
 const files=["../data/items.json","../index.html","../app.js"];
 for(const file of files){
 const s=readFileSync(new URL(file,import.meta.url),"utf8");
 assert.doesNotMatch(s,/TOURAPI_KEY|serviceKey=|source-registry\.json|internal\/raw\//i);
 }
});
