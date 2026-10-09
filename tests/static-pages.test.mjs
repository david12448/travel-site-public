import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {join,resolve,sep} from 'node:path';

const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const files=(path)=>readFileSync(join(root,path),'utf8');
const paths=[
  'destinations/korea/jeju/saryeoni-forest/',
  'destinations/korea/busan/gamcheon-culture-village/',
  'destinations/japan/kyoto/arashiyama/'
];
const config=JSON.parse(readFileSync(new URL('../config/site.json',import.meta.url),'utf8'));
const base=(process.env.SITE_URL || config.default_site_url).replace(/\/?$/, '/');
const prefix=new URL(base).pathname;

test('page hierarchy and readable names are generated for each approved place',()=>{
  for(const path of paths){
    assert.ok(existsSync(join(root,path,'index.html')),path);
    const html=files(path+'index.html');
    assert.match(html,/<h1>[^<]+<\/h1>/);
    assert.ok(html.includes('<link rel="canonical" href="'+base+path+'">'));
    assert.ok(html.includes('<meta name="description"'));
    assert.ok(html.includes('application/ld+json'));
  }
  for(const path of ['destinations/','destinations/korea/','destinations/korea/jeju/',
    'destinations/korea/busan/','destinations/japan/','destinations/japan/kyoto/']){
    assert.ok(existsSync(join(root,path,'index.html')),path);
  }
});
test('existing query parameter page and budget calculator still exist',()=>{
  const home=files('index.html');
  const js=files('app.js');
  assert.match(home,/id="budget-form"/);
  assert.match(home,/id="place-detail"/);
  assert.match(js,/renderPlaceDetail/);
  assert.match(js,/encodeURIComponent\(item.id\)/);
  assert.ok(home.includes('<link rel="canonical" href="'+base+'">'));

});
test('sitemap, robots, canonical and no-index on tiny category pages are consistent',()=>{
  const sitemap=files('sitemap.xml');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,5);
  for(const path of paths)assert.ok(sitemap.includes('<loc>'+base+path+'</loc>'));
  assert.ok(sitemap.includes('<loc>'+base+'</loc>'));
  assert.ok(files('robots.txt').includes('Sitemap: '+base+'sitemap.xml'));
  assert.ok(files('destinations/korea/jeju/index.html').includes('name="robots" content="noindex,follow"'));
  assert.ok(existsSync(join(root,'.nojekyll')));
});
test('build output never includes server private files or creator content',()=>{
  const manifest=JSON.parse(files('build-manifest.json'));
  assert.equal(manifest.entry_count,3);
  assert.equal(manifest.base_url,base);
  assert.ok(!existsSync(join(root,'approved')));
  assert.ok(!existsSync(join(root,'collectors')));
  assert.ok(!existsSync(join(root,'internal')));
});
test('deep link direct HTTP load, repeat refresh, and legacy query URL',async()=>{
  const server=createServer((req,res)=>{
    try{
      const url=new URL(req.url,'http://127.0.0.1');
      if(!url.pathname.startsWith(prefix)){res.writeHead(404).end('not found');return;}
      const relative=decodeURIComponent(url.pathname.slice(prefix.length));
      if(relative.includes('..')){res.writeHead(400).end('bad path');return;}
      const filepath=resolve(root,relative.endsWith('/')||!relative ? relative+'index.html' : relative);
      if(filepath!==root&&!filepath.startsWith(root+sep)){res.writeHead(400).end();return;}
      const html=readFileSync(filepath);
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end(html);
    }catch{res.writeHead(404).end('not found');}
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  try{
    const {port}=server.address();
    const origin='http://127.0.0.1:'+port+prefix;
    for(const path of paths){
      for(let count=0;count<2;count++){
        const response=await fetch(origin+path);
        assert.equal(response.status,200,path);
        assert.match(await response.text(),/<h1>[^<]+<\/h1>/);
      }
    }
    const old=await fetch(origin+'?place=kr-jeju-saryeoni-forest');
    assert.equal(old.status,200);
    assert.ok((await old.text()).includes('id="place-detail"'));
  }finally{await new Promise(ok=>server.close(ok));}
});
