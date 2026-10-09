import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root=new URL("../",import.meta.url);
const load=(p)=>JSON.parse(readFileSync(new URL(p,root),"utf8"));
const items=load("data/items.json").items;
const routeMap=load("data/url-routes.json");
const config=load("site.config.json");

test("route map has exactly one safely nested path for every approved location",()=>{
 const routes=routeMap.routes;
 assert.deepEqual(Object.keys(routes).sort(),items.map(x=>x.id).sort());
 assert.equal(new Set(Object.values(routes)).size,items.length);
 for(const item of items){
   const route=routes[item.id];
   assert.match(route,/^places\/[a-z]{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/);
   assert.equal(route.split("/")[1],item.country_code.toLowerCase());
   assert.ok(!route.includes(".."));
 }
});

test("direct deep links already have physical index HTML before deploying",()=>{
 for(const item of items){
   const route=routeMap.routes[item.id];
   const path=new URL(route+"index.html",root);
   assert.ok(existsSync(path),route);
   const html=readFileSync(path,"utf8");
   assert.ok(html.includes("<h1>"+item.title+"</h1>"),route+" identity");
   assert.ok(html.includes('href="../../../../styles.css"'),route+" assets");
   assert.ok(html.includes('href="../../../../"'),route+" home path");
   if(!process.env.SITE_ORIGIN){
     assert.ok(!html.includes("evococoons.com")&&!html.includes("prince-in-wonderworld.com"));
   }else{
     assert.ok(html.includes('rel="canonical"'));
     const origin=process.env.SITE_ORIGIN.endsWith("/") ? process.env.SITE_ORIGIN.slice(0,-1) : process.env.SITE_ORIGIN;
     assert.ok(html.includes(origin+"/"+route));
   }
 }
});

test("canonical host stays undecided and no unverified sitemap is published",()=>{
 assert.equal(config.public_origin,null);
 assert.equal(config.deployment_status,"not_configured");
 assert.equal(existsSync(new URL("sitemap.xml",root)),Boolean(process.env.SITE_ORIGIN));
});

test("old query route remains supported",()=>{
 const oldJS=readFileSync(new URL("lib/place-detail.mjs",root),"utf8");
 assert.ok(oldJS.includes('params.get("place")'));
});
