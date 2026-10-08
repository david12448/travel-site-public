# Public travel site implementation guidance

- `docs/PRODUCT_DECISIONS.md` 확인 후 작업. Public은 소비자 UI와 승인된 최소 데이터만.
- 모든 콘텐츠는 공식 검증 날짜, 출처 유형, 현재 이용 가능 여부를 구별한다.
- 날짜별 숙박 요금, 항공/배/버스/렌트카, 패키지, 홈쇼핑 방송 가격은 live/관찰/추정/미확인을 구분.
- 맛집은 별도 프로젝트의 versioned approved export/API로 결합, 원본 저장소 수집기 복제 금지.
- 내부 출처 URL, source registry, 원본 HTML/JSON, 인증정보, correction registry는 Public에 반영 금지.
- 마우스 hover/F12 주소 숨김은 서버 측 리디렉션만 설계 가능; 정적 페이지로는 목적지 매핑 완전 비공개 불가. 서버 준비 전 가짜 `/go/id` 링크 금지.
- 편집 글은 원문 복사보다 독창적 한국어 안내, 원어 지명 병기, 공식 교차검증 및 플랫폼 약관 준수.
- 가격 없음/미검증은 0원으로 바꾸지 않는다. 예산 계산기는 명시적인 사용자 입력 시에만 결과 표시.
- 실제 CI, live 데이터, 서비스 배포 여부는 확인한 것만 보고.
