# 여행 프로젝트 — URL/SEO 파일럿 작업 기록 (2026-10-10)

## 기존 상태 (실제 main 확인)
- `index.html` 리스트 카드가 `?place=<public-id>`로 연결. `lib/place-detail.mjs`에서 쿼리를 사용.
- 공식 확인된 국내 2개·해외 1개 장소만 `data/items.json`에 공개. 실시간 가격/맛집 링크는 없음.
- 공개 `index.html`은 보존하고 JS 예산 계산·필터도 유지.
- 독립 GitHub Pages 실제 공개 URL·DNS·도메인 연결은 이 작업에서 **변경/확인하지 않음**.

## 변경
- `data/url-routes.json` 안정 URL 매핑 (기존 public id 그대로, 프로바이더 내부 id 없음).
- `scripts/build_static_routes.py`: 승인된 모든 여행지를 실제 `places/{country}/{area}/{slug}/index.html`로 정적 생성.
- 실제 파일럿: `/places/kr/jeju/saryeoni-forest/`, `/places/kr/busan/gamcheon-culture-village/`, `/places/jp/kyoto/arashiyama/`.
- `app.js`는 정적 상세 경로로 이동; route-map 다운로드 장애시 기존 `?place=<id>`으로 fallback.
- 페이지마다 실질적으로 다른 검증된 장소 설명/확인일/방문 안내; 미검증 여행비·맛집은 0원으로 단정하지 않음.
- 링크는 상위 경로에 대한 상대 경로로 구성하여 `/travel-site-public/` 미리보기와 최종 서브도메인 루트에서 동작.
- `site.config.json.public_origin=null`. DNS·CNAME·canonical은 아직 발행하지 않음.
- `SITE_ORIGIN=https://verified-host/prefix/`를 **검증하고 확정한 후** 빌드시만 실제 절대 canonical 및 sitemap.xml을 생성. 아직 자동 제공하지 않음.

## 수동 재현/확인
```sh
python3 scripts/build_static_routes.py
node --test tests/*.test.mjs
python3 -m http.server 8000
# http://127.0.0.1:8000/places/kr/jeju/saryeoni-forest/
# http://127.0.0.1:8000/?place=kr-jeju-saryeoni-forest
```
CI에서는 모든 여행지별 실제 HTML 파일 존재·루트 asset 링크·구형 query 핸들러와 HTTP deep-link 200을 확인.

## 도메인 선택 전 확인/후속
1. 도메인은 evococoons.com 또는 prince-in-wonderworld.com 중 **미정**. 후보 `travel.<root>` 역시 DNS로 설정한 것이 아니다.
2. 실제 확인할 사이트 기준 주소를 정한 뒤만 `SITE_ORIGIN`에 **프로젝트 경로 포함한** 배포 루트를 입력. 예: `https://HOST/travel-site-public/` 또는 `https://HOST/`.
3. `SITE_ORIGIN` 설정→정적 빌드→canonical/sitemap 생성 → 실제 URL 직접접속/새로고침 검증→SEO 중복 링크 확인.
4. GitHub Pages는 정적 파일에 서버 301 제공하지 않음. 기존 쿼리 링크는 그대로 유지; 구주소를 무조건 강제 이동하지 않는다.
5. 상세 데이터가 수천 개 이상일 때 용량/빌드시간/배포 제약을 측정하고 필요한 경우 Cloudflare Pages/SSR/페이지별 빌드 평가.
6. 실제 도메인 연결 절차: 사이트 소유권 검증 → GitHub Pages Settings > Pages > Custom domain에 확인된 호스트 등록 → DNS 제공자에서 해당 서브도메인 CNAME을 GitHub Pages 사용자 호스트로 설정 → HTTPS/정규 경로 확인. **미승인 상태에서는 실행 금지.**
7. Blogger는 설명 글, travel 서브도메인은 실제 검색 및 필터/예산 서비스를 맡는다. 여행-맛집/금융 연결은 승인된 정규화 피드·공개 식별자를 통한 연결만.

## 주의
- 이 PR을 병합하는 것과 실제 Pages 배포가 성공했다는 것은 다르다. PR CI 결과 및 실제 배포/HTTP 접근 결과를 구분해 보고한다.
- `www.evococoons.com`이나 `www.prince-in-wonderworld.com`은 현재 선택되지 않았으며 자동 redirect 생성도 금지.
- 검색엔진은 canonical은 실제 절대 URL을 요구하므로 미확정 도메인으로 오인시킬 수 있는 tags를 넣지 않는다.
