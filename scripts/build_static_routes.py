"""Generate direct-requestable static pages for approved travel locations.

No canonical or sitemap is emitted until an explicit, verified SITE_ORIGIN is set.
Relative links work at both /travel-site-public/ and a custom-domain root.
"""
import html
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
SEGMENT=re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ROOT_PREFIX="places"
AREA_PATTERN=re.compile(r"^places/(kr|jp|[a-z]{2})/([a-z0-9-]+)/([a-z0-9-]+)/$")


def e(x):
    return html.escape(str(x if x is not None else ""),quote=True)


def site_origin():
    url=os.environ.get("SITE_ORIGIN","").strip()
    if not url:
        return None
    parsed=urlsplit(url)
    if parsed.scheme!="https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("Verified SITE_ORIGIN must be an absolute https origin/prefix")
    if parsed.path and not parsed.path.endswith("/"):
        raise ValueError("SITE_ORIGIN path prefix needs trailing slash")
    return url.rstrip("/")+"/"


def load_validated():
    items=json.loads((DATA/"items.json").read_text(encoding="utf-8"))["items"]
    route_doc=json.loads((DATA/"url-routes.json").read_text(encoding="utf-8"))
    if route_doc.get("schema_version")!="1.0" or not isinstance(route_doc.get("routes"),dict):
        raise ValueError("Invalid route map")
    routes=route_doc["routes"]
    if set(routes)!={i["id"] for i in items} or len(set(routes.values()))!=len(routes):
        raise ValueError("Routes must cover exactly approved locations, with no duplicates")
    for item in items:
        path=routes[item["id"]]
        match=AREA_PATTERN.fullmatch(path) if isinstance(path,str) else None
        if not match or match.group(1)!=item["country_code"].lower():
            raise ValueError("Unsafe, malformed or wrong-country travel route")
        if not all(SEGMENT.fullmatch(piece) for piece in path.strip("/").split("/")):
            raise ValueError("Invalid path segment")
        if not item.get("summary") or not item.get("verified_at") or not item.get("visit_tip"):
            raise ValueError("Only substantive reviewed records may receive deep links")
    return items,routes


def build_html(item,route,origin):
    heading=e(item["title"])
    site_name="여행의 결"
    title=f"{heading} | {site_name}"
    description=e(item["summary"][:155])
    prefix="../"*4
    canonical=(f'<link rel="canonical" href="{e(origin+route)}">' if origin else "")
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
{canonical}
<link rel="stylesheet" href="{prefix}styles.css">
<style>
.travel-static{{max-width:850px;margin:25px auto;padding:0 22px}}
.travel-static article{{background:white;border-radius:15px;padding:22px;border:1px solid #e5e5e5}}
.travel-static h1{{line-height:1.3}}
.travel-static p{{line-height:1.8}}
.travel-static dl{{display:grid;grid-template-columns:95px 1fr;gap:10px}}
.travel-static dt{{font-weight:700}}
.travel-static a{{color:#214a7e}}
@media(max-width:520px){{.travel-static{{padding:0 14px}}.travel-static article{{padding:15px}}}}
</style>
</head>
<body>
<header class="sitebar"><a class="brand" href="{prefix}">✳ 여행의 결</a></header>
<main class="travel-static">
<nav aria-label="이동"><a href="{prefix}">← 전체 여행지 검색</a></nav>
<article>
<p class="eyebrow">공식 출처 확인 · {e(item["verified_at"])}</p>
<h1>{heading}</h1>
<p>{e(item.get("native_name",item["title"]))}</p>
<p>{e(item["summary"])}</p>
<dl>
<dt>지역</dt><dd>{e(item["region"])} {e(item.get("district",""))}</dd>
<dt>공식 자료</dt><dd>{e(item.get("source_label","공식 관광 안내"))}</dd>
<dt>검증일</dt><dd>{e(item["verified_at"])}</dd>
</dl>
<h2>방문 전 알아둘 점</h2><p>{e(item["visit_tip"])}</p>
<h2>교통·숙박·주변 맛집</h2>
<p>이 장소에 대한 실시간 교통비·숙박비·주변 맛집 데이터는 아직 검증되어 연결되지 않았습니다. 상품/운영 조건은 공식 제공처에서 확인하세요.</p>
<p><a href="{prefix}#budget">여행 예상 경비를 직접 계산하기 →</a></p>
</article>
</main>
</body></html>
"""


def main():
    items,routes=load_validated()
    origin=site_origin()
    for item in items:
        route=routes[item["id"]]
        path=ROOT/route/"index.html"
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(build_html(item,route,origin),encoding="utf-8")
    sitemap=ROOT/"sitemap.xml"
    if origin:
        from xml.sax.saxutils import escape as xml_escape
        locs=[origin]+[origin+routes[item["id"]] for item in items]
        xml='<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        xml+="".join("  <url><loc>"+xml_escape(url)+"</loc></url>\n" for url in locs)+"</urlset>\n"
        sitemap.write_text(xml,encoding="utf-8")
    elif sitemap.exists():
        raise ValueError("Unverified sitemap must not survive without SITE_ORIGIN")
    print("travel pretty pages:",len(items),"canonical:",bool(origin))


if __name__=="__main__":
    main()
