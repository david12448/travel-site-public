# EvoCocoons 여행 URL 전환 설계 — 2026-10-10

## 현재 확인된 실제 상태
- 공개: david12448/travel-site-public, Private: david12448/travel-source-private.
- main 홈페이지 index.html + JS + data/items.json 3건. 상세는 /?place=<public_id>.
- GitHub REST repository metadata: 2026-10-10 기준 **has_pages=false**. 따라서 https://david12448.github.io/travel-site-public/ 는 **예정된 Pages 기본 주소**일 뿐, 지금 서비스되는 실제 URL이라고 주장하지 않는다.
- 당시 열린 PR: Public #2(음식 데이터 계약), #3(운영 문서), Private #2(음식 데이터 계약), #4(운영 문서). 이번 PR과 별개로 보존.
- 현재 repo에는 기존 iframe/embed 페이지나 Blogger/Tistory 연결 주소가 없음. 외부에 공유된 /?place= 링크의 존재 가능성은 있으므로 영구 지원.

## 채택한 경로
- 서비스 홈: /
- 국가/지역 상위 탐색: /destinations/, /destinations/korea/, /destinations/korea/jeju/
- 항목: /destinations/korea/jeju/saryeoni-forest/
- 항목: /destinations/korea/busan/gamcheon-culture-village/
- 항목: /destinations/japan/kyoto/arashiyama/
- 기본 GitHub project Pages에서는 /travel-site-public/ 접두사를 포함한다.
- 상위 지역별 1건만 존재하는 분류는 안내용으로 생성하지만 noindex,follow로 두고 sitemap에서는 뺀다.
- 정보가 별도로 없는 필터·임베드·식당·호텔 페이지를 무작정 생성하지 않는다.

## slug 불변 규칙
영문 소문자, 단어 사이 하이픈, 지역·국가와 결합한 경로, 마지막 슬래시 고정. 내부 식별자/무의미한 날짜를 공개 경로로 넣지 않는다. 다국어 지명은 로마자 지역 이름을 안정적으로 유지.
data/routes.json이 **공개 ID ↔ 사람이 읽는 고정 경로의 계약**이다. 이름이 바뀌더라도 공개 경로를 자동 변경하지 않으며, 중복 ID/중복 경로/미등록 장소는 빌드를 실패시킨다.
이전·폐쇄·명칭 변경 시 무조건 삭제하지 않는다. 이전 경로를 유지해 상태·새 위치 안내 또는 별도 명시적 alias 대응. 301은 정적 GitHub Pages에서 서버 측 제어가 불가능하므로 301 제공을 주장하지 않는다.

## 기존 주소 보존
- /?place=kr-jeju-saryeoni-forest 등은 홈페이지 JS로 계속 처리한다.
- 목록 카드의 **새 클릭**은 pretty URL로 간다.
- 쿼리 페이지는 JS 실행 후 해당 pretty URL로 canonical을 갱신하되, 원래 상세 표시는 그대로 유지하며 자동 리다이렉트하지 않는다.
- 기존 /#budget, /?place=<public_id>#budget, Blogger 외부 링크의 기본 경로는 기존 index.html에 남는다.
- 기존 canonical 집약 및 Google/Naver SEO는 JavaScript 처리·색인 상황에 따라 추후 실제 색인 검증이 필요하며, 정적 301은 보장하지 않는다.

## 정적 파일 생성과 빌드
node scripts/build-site.mjs
- config/site.json default_site_url로 GitHub Pages repo 기본 경로를 중앙 집중 관리
- SITE_URL 환경변수로 https://travel.evococoons.com/ 또는 다른 브랜드 도메인을 지정해 전체 canonical/sitemap/내부 절대경로를 일괄 재생성
- dist/ 아래 정적 index.html + destinations/.../index.html + sitemap.xml + robots.txt + .nojekyll
- 원본 repo root의 index.html, app.js, styles.css, lib/, data/는 파손 없이 복사
- 내부 Private 데이터나 원본 URL을 빌드로 가져오지 않는다.
- CI는 Node 기반 테스트 + 정적 HTTP 직접 접속/동일 링크 반복 로드/쿼리 호환 검사를 수행한다.

## Hosting 의사결정
- **현재**: Node SSG(0개 외부 빌드 의존성) + GitHub Pages에 dist/ 디렉터리 아티팩트로 배포가 가장 단순.
- GitHub Pages에서 repo root를 branch deploy하면 dist/의 생성된 페이지가 사이트 root로 자동 노출되지 않으므로, 최종 배포는 GitHub Actions source + actions/upload-pages-artifact / deploy-pages를 선택한다.
- GitHub Pages는 동적 DB/저장소 내부 데이터 차단/진짜 서버 리디렉션/요청별 API를 제공하지 않는다.
- 수천·수만 건에서 빌드시간, repository size, 배포 파일 수, 검색 페이지 속도와 개인정보·라이선스 범위, 검색 색인 품질을 측정해 증분 생성/서버 검색/Cloudflare Pages(Workers) 전환 검토.
- 대량 생성 시 공개 색인 대상은 실제로 다른 정보를 보유한 상세 항목만. 얇은 분류 자동 색인 금지.

## GitHub Pages 활성화(추후 별도)
설계 PR은 병합 전까지 main/Pages를 변경하지 않는다. repo Settings > Pages > Build and deployment > Source: GitHub Actions 선택 후, 별도 배포 workflow를 추가하고 환경 github-pages에서 main만 배포 가능하게 제한한다. 배포가 활성화되지 않으면 실제 인터넷 직접 접속/새로고침 성공을 주장하지 않고, CI의 **로컬 정적 HTTP 서버 테스트**와 구분한다.

## 추후 DNS·Custom Domain (현재는 수행 금지)
원하는 대표 브랜드를 최종 선택한 다음:
1. GitHub의 도메인 소유 확인(권장), 타 프로젝트와 중복 사용 여부 확인.
2. GitHub Pages Settings > Custom domain에 travel.evococoons.com **또는** travel.prince-in-wonderworld.com 설정.
3. DNS에서 해당 travel 호스트의 CNAME → david12448.github.io 로 지정 (**/travel-site-public 경로를 DNS 값에 넣지 않음**).
4. Pages의 Enforce HTTPS 활성화를 확인하고 인증서 발급·전파 확인.
5. 빌드 Secret/Variable 또는 GitHub Actions env SITE_URL을 확정 HTTPS 오리진 루트 주소로 바꿔 canonical, sitemap, 링크를 재생성.
6. 사이트/기존 북마크/블로그 임베드/검색 색인/새로고침 검증. GitHub Pages 기본 주소에서 맞춤 도메인으로의 이동 정책은 실제 배포 환경에서 확인.
DNS/CNAME/Cloudflare 설정은 승인 전 변경하지 않는다.

## Blogger/Tistory·별도 프로젝트 연동
설명 글은 www 대표 블로그에서 작성, 여행 일정·경비 계산 및 목적지 조회는 travel 도구에서 제공. 여행 ↔ 맛집/교통/보험/카드 연계는 각 Public API/버전 계약으로만 진행. /embed/는 사용자 경험과 콘텐츠를 검증한 기능부터 별도 템플릿/iframe 크기 및 host 설정을 검토한다. 지금 임의로 iframe 페이지를 만들지 않는다.

## 실패 방지 및 이력
- 정적 페이지 없이 history.pushState()만 쓰면 직접 접속 시 404 → 반드시 directory/index.html 출력 검증.
- domain을 여러 파일에 하드코딩하면 migration 때 canonical/sitemap 불일치 → config/site.json + SITE_URL만 사용.
- 기존 /?place= 링크를 즉시 리다이렉트하면 공유 URL·앵커·예산 계산기가 깨질 수 있음 → renderPlaceDetail 유지.
- 공개 raw/source registry/출처 링크 유출 방지 → Public approved fields로만 SSG 작성.
- 공통 규칙으로 재사용할 후보: slug freeze manifest, base-origin central config, noindex thin categories, deep-link HTTP/legacy-query regression.
