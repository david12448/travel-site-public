# 여행 사이트의 맛집 연동 계약 v1

이 저장소는 여행 공개 화면을 담당하며, 추후 별도의 맛집 공개 저장소에서 발행하는 **검증 완료 데이터만** 조회한다. 수집기/원본 스냅샷/원본 URL 매핑은 공개 영역에 두지 않는다.

## 주요 화면
- 여행지/지역 페이지의 '근처 맛집' 섹션
- 관광명소 상세페이지의 '주변 음식점' 카드
- 여행 일정에 식사 장소 추가
- 맛집 상세에서 '주변 여행지 보기'로 돌아가기
- 티스토리 임베드(`?embed=1`)와 모바일 카드/검색 대응

## 공통 질의
`destination_id`(권역 공개 ID) 및 선택적 `spot_id`(명소 공개 ID)로 공개 피드를 필터링한다. 표시 순서는 '협찬·인기·평점'으로 위장하지 않는다. 데이터 출처와 추천 기준을 명확히 밝힌다.

## 피드 파일
- 계약: `schema/restaurant-feed.v1.schema.json`
- 초기 빈 피드: `public/data/restaurants.json`
- 최종 생산자: `restaurant-site-public`의 검증된 배포 파이프라인
- 데이터 미도착/검증되지 않음: '아직 확인된 맛집 정보가 없습니다' 표시. 임의 추천 금지.

## 보호 및 출처 표시
음식점에 사용하는 `restaurant_id`, `destination_ids`, `nearby_spot_ids`는 서비스 고유 공개 ID이며 제3자 API의 id와 다르다. 내부 경로, 공급처 item id, 원본 URL을 노출하지 않는다. 출처기관의 표시 의무는 `attribution`을 통해 충족한다. '공식 원본 보기'는 서버측 redirect 준비 및 출처 이용권 확인 이후 source_token 기반으로만 제공한다.

## 공개 안전 규칙
영업상태는 `open/closed/unknown`(행정·수집 당시 상태)이며 실시간 영업여부를 뜻하지 않는다. 시간/가격/예약 가능 여부는 검증일을 함께 제공하고, 검증되지 않은 항목은 표시하지 않는다. 미쉐린 등 연도별 선정 사실은 연도 없이 상시 배지로 표시하지 않는다. SNS·블로그 후기/사진을 무단 전재하지 않는다.



## 2026-10-10 publication guard verification

An encoded URL in an otherwise allowed consumer field reproduced a bypass of
the previous string guard. Corrected regex escaping and added bounded percent,
HTML entity and Unicode-escape decoding, nested value/key checks and common
credential-shape rejection. Error output does not echo matched values.

Eight feed tests passed locally, including nested arrays/recognitions and encoded
synthetic strings. No production secret is a fixture. This feed intentionally
has no direct URL field; official consumer links in other contracts require an
explicit purpose-based policy instead of globally banning official websites.

This is a validator fix in the existing integration PR, not a new deployed feed.
No merge or deployment was performed. It does not establish a comprehensive audit
of repository history, all client assets or every possible obfuscation format.
