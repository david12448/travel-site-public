import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

const here = (path) => new URL('../'+path, import.meta.url);
const load = async (path) => JSON.parse(await readFile(here(path), 'utf8'));
const data = await load('data/items.json');
const routeData = await load('data/routes.json');
const config = await load('config/site.json');
const selectedUrl = process.env.SITE_URL || config.default_site_url;
const parsedBase = new URL(selectedUrl);
if (parsedBase.protocol !== 'https:' || parsedBase.search || parsedBase.hash || !parsedBase.hostname) {
  throw new Error('SITE_URL must be an absolute HTTPS URL without query or fragment');
}
const base = parsedBase.href.endsWith('/') ? parsedBase.href : parsedBase.href+'/';
const basePath = new URL(base).pathname;
const output = here('dist/');
const escapeHtml = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const escapeXml = escapeHtml;
const safeJson = (v) => JSON.stringify(v).replaceAll('<','\\u003c');
const absolute = (path) => base+path;
const local = (path) => basePath+path;
const write = async (path,content) => {
  const target = here('dist/'+path);
  await mkdir(dirname(fileURLToPath(target)),{recursive:true});
  await writeFile(target,content,'utf8');
};
const seenIds = new Set(), seenPaths = new Set(), routeMap = new Map();
if(data.schema_version!==1 || !Array.isArray(data.items)||routeData.schema_version!==1||!Array.isArray(routeData.routes)){
  throw new Error('Approved data/routes schema invalid');
}
for(const entry of routeData.routes){
  if(typeof entry.id!=='string'||typeof entry.path!=='string'
    || !/^destinations\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(entry.path)){
    throw new Error('Route must use stable lowercase slug hierarchy');
  }
  if(seenIds.has(entry.id)||seenPaths.has(entry.path))throw new Error('Duplicate route ID/path');
  seenIds.add(entry.id);seenPaths.add(entry.path);routeMap.set(entry.id,entry.path);
}
if(data.items.length!==routeMap.size || data.items.some(x=>!routeMap.has(x.id))) {
  throw new Error('Each public place requires an explicit frozen route');
}
function documentFor(title,description,body,canonicalPath,robots='index,follow',structuredData=null){
  const canonical = absolute(canonicalPath);
  const jsonLd = structuredData ? '<script type="application/ld+json">'+safeJson(structuredData)+'</script>' : '';
  return '<!doctype html>\n<html lang="ko"><head>\n'
    + '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'
    + '<meta name="robots" content="'+escapeHtml(robots)+'">\n'
    + '<title>'+escapeHtml(title)+'</title>\n'
    + '<meta name="description" content="'+escapeHtml(description)+'">\n'
    + '<link rel="canonical" href="'+escapeHtml(canonical)+'">\n'
    + '<link rel="stylesheet" href="'+escapeHtml(local('styles.css'))+'">\n'
    + jsonLd + '\n</head><body>\n'
    + '<header class="sitebar"><a class="brand" href="'+escapeHtml(basePath)+'">✳ 여행의 결</a>'
    + '<span class="muted small">국내·해외 여행의 발견부터 예산까지</span></header>\n'
    + '<main class="section place-detail">\n'+body+'\n</main>\n'
    + '<footer><strong>여행의 결</strong><p>확인되지 않은 요금·재고는 표시하지 않습니다.</p></footer>\n'
    + '</body></html>\n';
}
function itemCard(item){
  const path=routeMap.get(item.id);
  return '<li><a href="'+escapeHtml(local(path))+'">'+escapeHtml(item.title)+'</a> — '
    +escapeHtml(item.summary)+'</li>';
}
function categoryPage(title,subtitle,items,path,ancestors=[]){
  const back=ancestors.map(a=>'<a href="'+escapeHtml(local(a.path))+'">'+escapeHtml(a.name)+'</a>').join(' / ');
  const main='<p class="eyebrow">TRAVEL GUIDE</p><h1>'+escapeHtml(title)+'</h1>'
    +'<p>'+escapeHtml(subtitle)+'</p><p>'+back+'</p>'
    +'<ul class="seo-places">'+items.map(itemCard).join('')+'</ul>';
  // Single-item category pages are navigation aids, excluded from sitemap to avoid thin indexing.
  const robots = items.length < 2 ? 'noindex,follow':'index,follow';
  return documentFor(title+' | 여행의 결',subtitle,main,path,robots);
}
await rm(output,{force:true,recursive:true});
for(const filename of ['styles.css','app.js','lib/budget.mjs','lib/place-detail.mjs','data/items.json','data/routes.json']){
  const target=here('dist/'+filename);
  await mkdir(dirname(fileURLToPath(target)),{recursive:true});
  await cp(here(filename),target);
}
const home = await readFile(here('index.html'),'utf8');
if(!home.includes('</head>'))throw new Error('Existing homepage template missing head');
await write('index.html',home.replace('</head>',
  '<link rel="canonical" href="'+escapeHtml(base)+'">\n</head>'));
await write('.nojekyll','');
await write('destinations/index.html',categoryPage('국내·해외 여행지','공식 관광 안내로 검증한 여행지를 찾아보세요.',data.items,'destinations/',[{path:'',name:'홈'}]));
const countries=new Map(), districts=new Map();
for(const item of data.items){
  if(item.provenance!=='official'||item.price_status!=='unknown')throw new Error('Pilot only publishes verified, unpriced official places');
  const path=routeMap.get(item.id);
  const [section,country,region]=path.split('/');
  const countryDir=section+'/'+country+'/', districtDir=countryDir+region+'/';
  if(!countries.has(countryDir))countries.set(countryDir,[]);
  if(!districts.has(districtDir))districts.set(districtDir,[]);
  countries.get(countryDir).push(item);
  districts.get(districtDir).push(item);
  const description = item.summary;
  const detail = '<nav aria-label="경로"><a href="'+escapeHtml(basePath)+'">홈</a> / '
    +'<a href="'+escapeHtml(local('destinations/'))+'">여행지</a> / '
    +'<a href="'+escapeHtml(local(countryDir))+'">'+escapeHtml(country)+'</a> / '
    +'<a href="'+escapeHtml(local(districtDir))+'">'+escapeHtml(region)+'</a></nav>'
    +'<p class="eyebrow">OFFICIAL TRAVEL GUIDE</p><h1>'+escapeHtml(item.title)+'</h1>'
    +(item.native_name&&item.native_name!==item.title?'<p class="muted">'+escapeHtml(item.native_name)+'</p>':'')
    +'<p class="muted">지역: '+escapeHtml(item.region)+' · '+escapeHtml(item.district||'')
    +' · 자료 확인: '+escapeHtml(item.verified_at)+'</p>'
    +'<h2>어떤 여행지인가요?</h2><p>'+escapeHtml(item.summary)+'</p>'
    +'<h2>방문 전 참고할 점</h2><p>'+escapeHtml(item.visit_tip||'방문 전 최신 공식 안내를 확인하세요.')+'</p>'
    +'<p><strong>검증 안내:</strong> '+escapeHtml(item.source_label)
    +'의 안내를 바탕으로 작성했습니다. 교통비·숙박요금·입장료·영업시간·예약 가능 여부는 현재 확인되지 않았습니다.</p>'
    +'<p><a href="'+escapeHtml(local(''))+'#budget">내 여행 경비 직접 계산하기 →</a></p>';
  const structuredData={'@context':'https://schema.org','@type':'TouristAttraction',
    name:item.title,description:item.summary,
    address:{'@type':'PostalAddress',addressCountry:item.country_code,addressRegion:item.region}};
  await write(path+'index.html',documentFor(item.title+' 여행 안내 | 여행의 결',description,detail,path,'index,follow',structuredData));
}
for(const [path,items] of countries){
  const country=path.split('/')[1];
  const name=country==='korea'?'대한민국':country==='japan'?'일본':country;
  await write(path+'index.html',categoryPage(name+' 여행지',name+'에서 공식 확인된 명소를 탐색합니다.',items,path,[{path:'',name:'홈'},{path:'destinations/',name:'여행지'}]));
}
for(const [path,items] of districts){
  const [_,country,region]=path.split('/');
  const name=items[0].region;
  await write(path+'index.html',categoryPage(name+' 여행지',name+' 지역에서 공식 확인된 명소를 탐색합니다.',items,path,[{path:'',name:'홈'},{path:'destinations/',name:'여행지'},{path:'destinations/'+country+'/',name:country}]));
}
const sitemapPaths=['','destinations/',...Array.from(routeMap.values())];
const xml='<?xml version="1.0" encoding="UTF-8"?>\n'
  +'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  +sitemapPaths.map(path=>'<url><loc>'+escapeXml(absolute(path))+'</loc></url>').join('\n')
  +'\n</urlset>\n';
await write('sitemap.xml',xml);
await write('robots.txt','User-agent: *\nAllow: /\nSitemap: '+absolute('sitemap.xml')+'\n');
await write('build-manifest.json',JSON.stringify({base_url:base,routes:routeData.routes,entry_count:data.items.length},null,2)+'\n');
console.log('Static travel site built: '+data.items.length+' places; '+countries.size+' country + '+districts.size+' district indexes; base '+base);
