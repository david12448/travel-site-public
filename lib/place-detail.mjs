/* Static detail for reviewed records only. Intentionally never embeds original source URLs. */
const sections = [
  ["교통·이동", "항공·기차·버스·배편·렌터카는 출발지와 실제 여행 날짜에 따라 달라집니다. 확인된 노선·요금이 연동되면 이곳에 표시합니다."],
  ["숙박", "호텔스닷컴·야놀자·여기어때 등 실제 예약 날짜에 맞는 숙박비는 아직 연결되지 않았습니다. 성수기·비수기 요금을 추정 판매가로 표시하지 않습니다."],
  ["맛집·음식", "별도로 구축하는 맛집 시스템에서 지역과 위치가 확인된 식당만 이 여행지에 연결합니다. 현재는 검증된 연결 정보가 없습니다."],
  ["여행사·홈쇼핑", "여행사 패키지와 홈쇼핑 방송상품은 출발일, 추가 비용, 판매 여부가 확인되면 연결합니다. 방송 당시 가격을 현재 가격으로 소개하지 않습니다."],
  ["여행 영상·방송", "유튜버·인플루언서·TV 프로그램에서 확인된 여행 영상은 장소 동일성과 콘텐츠 사용 조건을 검토한 뒤 연결합니다."],
];
const make=(tag,content,cls)=>{
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(content!==undefined)element.textContent=content;
 return element;
};
export function pickPlace(items,publicId){
 if(!Array.isArray(items)||typeof publicId!=="string"||!/^[a-z0-9-]{1,90}$/.test(publicId))return null;
 return items.find(x=>x.id===publicId)||null;
}
export function renderPlaceDetail(items,root){
 const params=new URLSearchParams(window.location.search);
 const id=params.get("place");
 const item=pickPlace(items,id);
 if(!item || !root)return false;
 root.replaceChildren();
 root.hidden=false;
 const back=make("a","← 모든 여행지 보기","detail-back");back.href="./";
 const top=make("div",undefined,"detail-top");
 const eyebrow=make("p",item.country_code==="KR"?"국내 여행지 · 공식 안내 검증":"해외 여행지 · 공식 안내 검증","eyebrow");
 const title=make("h2",item.title);title.id="detail-title";
 const native=item.native_name&&item.native_name!==item.title?make("p",item.native_name,"muted small"):null;
 const meta=make("p",[item.region,item.district,"자료 확인 "+item.verified_at].filter(Boolean).join(" · "),"muted");
 const summary=make("p",item.summary,"detail-summary");
 top.append(eyebrow,title);if(native)top.append(native);top.append(meta,summary);
 const source=make("div",undefined,"detail-source");
 source.append(make("strong","정보 확인"),make("p","공식 참고 기관: "+(item.source_label||"공식 관광 안내")));
 source.append(make("p","예약 가능 여부, 입장료, 영업시간, 교통편은 현재 확인되지 않았습니다.","muted small"));
 const tip=make("div",undefined,"detail-tip");
 tip.append(make("h3","방문 전에 살펴볼 점"),make("p",item.visit_tip||"현지 공식 안내와 최신 운영 조건을 확인하세요."));
 const heading=make("h3","여행 계획을 완성하는 정보");
 const note=make("p","아래 항목은 향후 연결할 정보 분야입니다. 현재 실제 검색 결과나 추천 목록이 아닙니다.","muted small");
 const grid=make("div",undefined,"detail-grid");
 for(const [label,description] of sections){
   const section=make("section",undefined,"detail-card");
   section.append(make("h4",label),make("p",description));
   grid.append(section);
 }
 const cost=make("div",undefined,"detail-estimate");
 cost.append(make("strong","이 여행지의 실시간 경비는 아직 없습니다."));
 cost.append(make("p","교통비·객실당 1박 숙박비·식비를 직접 입력해 예상 예산을 계산할 수 있습니다.","muted small"));
 const link=make("a","직접 경비 계산하기 →","detail-link");link.href="#budget";cost.append(link);
 root.append(back,top,source,tip,heading,note,grid,cost);
 document.getElementById("discover-section").hidden=true;
 document.querySelector(".hero").hidden=true;
 document.title=item.title+" | 여행의 결";
 return true;
}
