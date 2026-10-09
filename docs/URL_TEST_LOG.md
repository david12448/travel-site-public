# URL 파일럿 테스트·시행착오 기록 — 2026-10-10

## 기존 상태와 변경 범위
- 현재 main: /?place=<public-id> JavaScript 상세 렌더링; data/items.json에 공식 요약 3건.
- Repo API의 has_pages=false. 2026-10-10 기준 공개 Pages 배포는 미설정.
- 이번 브랜치: 새 고정 URL을 dist/destinations/.../index.html로 출력하고, 기존 루트 index.html은 그대로 보존.
- 구버전 공유 링크와 /#budget 경로도 보존.
- 기존 공개/비공개 저장소에 열려 있던 외부 PR과 변경 충돌 피함.

## 테스트 실패 #1
- GitHub Actions Run 37969507619: 정적 빌드, 13개 테스트 성공. 14번 HTTP 직접 접속 테스트는 예상 200, 실제 400.
- 생성 HTML 파일은 모두 존재하고 정적 페이지 생성은 성공.
- 테스트용 root=fileURLToPath(new URL('../dist/'))의 마지막 슬래시와 filepath.startsWith(root+path.sep) 검사로 이중 슬래시 비교가 발생.
- 해결: HTTP document root를 resolve(fileURLToPath(...))로 정규화해 상위 경로 탈출 방지를 유지.
- 수정 후 GitHub Actions에서 전체 검증하며 미검증 실제 배포를 성공이라고 주장하지 않는다.

## 공통 운영 개선 후보 (project-common-rules)
- 공개 slug를 자동 변경하지 않고 버전 있는 route manifest로 고정.
- URL의 origin/path는 중앙 설정과 SITE_URL 환경변수에서만 조정.
- 정적 서버 직접 요청/동일 URL 재요청 테스트와 브라우저 SPA route test를 구분.
- 기존 query deep link, 검색, 예산 기능을 회귀 검사.
- 콘텐츠 1개짜리 상위 분류 페이지는 noindex,follow 후 SEO 품질을 점검.
- GitHub Pages 비활성 시 CI HTTP 테스트와 실제 배포 URL 검증을 구분 보고.
- 대표 도메인 결정 전에는 CNAME 파일을 만들지 않고 SITE_URL로 대체 브랜드 빌드만 검사.
