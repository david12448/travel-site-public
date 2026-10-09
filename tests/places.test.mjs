import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {pickPlace} from "../lib/place-detail.mjs";

const data=JSON.parse(readFileSync(new URL("../data/items.json",import.meta.url),"utf8"));
test("only verified official records are displayed",()=>{
 assert.equal(data.items.length,3);
 assert.deepEqual(new Set(data.items.map(x=>x.country_code)),new Set(["KR","JP"]));
 assert.ok(data.items.every(x=>x.provenance==="official"&&x.verified_at==="2026-10-09"));
});
test("identity route selects only a public place",()=>{
 const item=pickPlace(data.items,"jp-kyoto-arashiyama");
 assert.equal(item?.title,"교토 아라시야마");
 assert.equal(pickPlace(data.items,"missing"),null);
 assert.equal(pickPlace(data.items,"../../../etc/passwd"),null);
});
test("no raw data, original url or quoted prices exposed",()=>{
 const text=JSON.stringify(data);
 assert.doesNotMatch(text,/https?:\/\/|source.registry|serviceKey|private|internal\/raw/i);
 assert.ok(data.items.every(x=>x.price_status==="unknown"&&x.price_amount===null));
});
test("all records contain usable detail information",()=>{
 for(const x of data.items){
   for(const k of ["title","native_name","region","summary","source_label","visit_tip","verified_at"])
     assert.ok(typeof x[k]==="string"&&x[k].trim());
 }
});
