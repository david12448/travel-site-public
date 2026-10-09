# travel-site-public

여행·관광·쉼·휴식 정보 통합 포털 공개 프런트엔드 파일럿입니다. 원본 수집과 가격 검증은 **Private** `david12448/travel-source-private`에서 처리합니다.

## 콘셉트
관광지 하나를 열면 공식 사실, 크리에이터·방송에서 발견한 여행 이야기, 이동방법, 날짜별 숙박, 패키지/홈쇼핑, 여행 예산, 별도 맛집 프로젝트의 검증된 식당을 유기적으로 보여줄 예정입니다.

## 현재 제공
- 모바일 대응 탐색 화면(국내/해외, 관광/휴식, 교통·숙박·패키지 등 필터)
- 공식 관광 안내에서 직접 확인한 국내 2곳·해외 1곳의 최초 검증 소개(가격은 미확인)
- 사람이 직접 입력한 값으로만 계산하는 예상 경비 계산기(실제 예약·조회 가격이 아님)
- 공개 허용 목록 구조의 `data/items.json`과 클릭 가능한 개별 여행지 상세 화면
- Node 기본 테스트: `node --test tests/*.test.mjs`

`index.html`을 정적 웹서버(GitHub Pages 포함)에서 열 수 있습니다.

## 중요 경계
- Public HTML/JS/JSON에 collector 정보, 원본 URL 매핑, 내부 source ID, 가격 수집 endpoint/keys를 넣지 않습니다.
- 사용자가 실제로 조회한 판매처 링크 기능은 **신뢰할 수 있는 서버 리디렉션**을 만든 뒤에만 활성화합니다. 정적 배포만으로 서버 측 숨김을 구현했다고 주장하지 않습니다.
- 관광/상품/식당 사실 및 실가격은 Private에서 검증·승인된 기록만 표시합니다.
- 다른 서비스의 사진·영상·본문을 허가 없이 복제하지 않습니다.

## 진행 현황 (2026-10-09)
공식 관광 페이지 3곳(제주 사려니숲길/부산 감천문화마을/교토 아라시야마)의 고정 장소 사실을 수동 검증해 요약. 출처 근거와 URL 목록은 Private 검토 레코드에서만 보관합니다. 실제 숙박 요금/패키지 방송가/맛집 데이터의 자동 수집·배포는 아직 하지 않았습니다.

## 읽기 쉬운 고정 URL 파일럿 (2026-10-10)

`node scripts/build-site.mjs` 실행 시 `dist/`에 홈·국가/지역 인덱스·명소 개별 HTML·canonical·sitemap.xml·robots.txt를 생성합니다. 공식 여행지 3곳의 경로는 `data/routes.json`에서 변경 없이 관리합니다.

- 예시: `/destinations/korea/jeju/saryeoni-forest/`, `/destinations/korea/busan/gamcheon-culture-village/`, `/destinations/japan/kyoto/arashiyama/`
- 기존 `/?place=<public_id>` 상세 링크와 `/#budget` 경로는 보존합니다.
- 기본 빌드 목적지는 GitHub Pages **계획 주소** `https://david12448.github.io/travel-site-public/`이며, GitHub Pages는 아직 설정되지 않았습니다.
- 장기 주소는 `travel.evococoons.com` 또는 다른 대표 브랜드 선택 후 `SITE_URL=https://선택한-도메인/` 한 곳만 변경해 재생성합니다. 지금 DNS 연결하지 않습니다.
- URL 설계와 검증/Pages 설정 및 DNS 이관 절차는 `docs/URL_ARCHITECTURE.md` 참고.
- GitHub Actions는 PR·main에서 `dist/` 빌드, 직접 경로 HTTP 테스트 및 아티팩트 업로드까지만 진행하며 **PR 병합·Pages 배포는 자동 실행하지 않습니다**.
