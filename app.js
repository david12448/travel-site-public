import { estimateBudget } from "./lib/budget.mjs";
import { renderPlaceDetail } from "./lib/place-detail.mjs";
const el = (id) => document.getElementById(id);
let items = [];
const typeNames = {sight:"관광지",festival:"축제·행사",relax:"쉼·휴식",hidden:"숨은 명소",transport:"교통",lodging:"숙박",package:"패키지·홈쇼핑",dining:"맛집"};
const money = (x) => new Intl.NumberFormat("ko-KR").format(x) + "원";

function draw() {
  const q = el("search").value.trim().toLocaleLowerCase();
  const scope = el("scope").value;
  const kind = el("kind").value;
  const filtered = items.filter(x =>
    (scope === "all" || (scope === "KR" ? x.country_code === "KR" : x.country_code !== "KR"))
    && (kind === "all" || x.type === kind)
    && [x.title,x.region,x.summary,...(x.tags||[])].join(" ").toLocaleLowerCase().includes(q)
  ).slice(0, 20);
  el("result-count").textContent = filtered.length + "개" + (items.length > 20 ? " (최대 20개 표시)" : "");
  const root = el("results"); root.replaceChildren();
  el("empty").hidden = filtered.length > 0;
  if (!filtered.length && items.length) {
    el("empty").querySelector("h3").textContent = "조건에 맞는 여행정보가 없습니다.";
    el("empty").querySelector("p").textContent = "검색어와 지역·관심사 필터를 바꿔 보세요.";
  }
  for (const item of filtered) {
    const article = document.createElement("a"); article.className="item"; article.href="./?place="+encodeURIComponent(item.id); article.setAttribute("aria-label",item.title+" 상세보기");
    const kind = document.createElement("span"); kind.className="eyebrow"; kind.textContent=typeNames[item.type] || "여행정보";
    const name = document.createElement("h3"); name.textContent=item.title;
    const summary=document.createElement("p"); summary.textContent=item.summary;
    const meta=document.createElement("div"); meta.className="item-meta";
    meta.textContent=[item.region, "확인 "+item.verified_at, item.price_status === "live_verified" ? "가격 제공 조건 확인 필요" : "실시간 가격 미제공"].filter(Boolean).join(" · ");
    article.append(kind,name,summary,meta); root.append(article);
  }
}
async function load() {
  try {
    const response = await fetch("./data/items.json", {cache:"no-store"});
    if(!response.ok) throw new Error("데이터 요청 실패");
    const data=await response.json();
    if(data.schema_version !== 1 || !Array.isArray(data.items)) throw new Error("데이터 형식 오류");
    items=data.items.filter(x=>x&&typeof x.title==="string"&&typeof x.region==="string"&&typeof x.verified_at==="string");
    el("data-status").textContent="검증 공개 자료 "+items.length+"건";
  } catch {
    items=[]; el("data-status").textContent="자료 연결 확인이 필요합니다.";
  }
  draw();
  renderPlaceDetail(items,el("place-detail"));
}
["search","scope","kind"].forEach(id=>el(id).addEventListener("input",draw));
el("budget-form").addEventListener("submit",(event)=>{
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const moneyFields=["transport","roomNight","foodDaily","admissions","localTransport","reserve"];
  const missing=moneyFields.filter(k=>String(form.get(k)??"").trim()==="");
  if(missing.length===moneyFields.length){
    el("budget-result").textContent="교통비·숙박비·식비 등 금액을 하나 이상 입력해 주세요.";
    return;
  }
  const input={}; for(const name of ["people","days","nights","rooms",...moneyFields]){
    const raw=String(form.get(name)??"").trim();
    input[name]=raw==="" ? 0 : Number(raw);
  }
  try {
    const result=estimateBudget(input);
    const view=el("budget-result"); view.replaceChildren();
    const title=document.createElement("p"); title.textContent="직접 입력한 금액으로 계산한 합계 (실제 판매가 아님)";
    const big=document.createElement("div"); big.className="price-big"; big.textContent=money(result.total);
    const notice=document.createElement("p"); notice.textContent=missing.length ? "미입력 항목 "+missing.length+"개는 합계에 포함하지 않았습니다. 실제 총 여행비보다 적을 수 있습니다." : "모든 항목을 입력했습니다. 실제 가격·세금·시즌 조건과 다를 수 있습니다.";
    const ul=document.createElement("ul"); ul.className="cost-list";
    const names={transport:"왕복/장거리 교통",lodging:"숙박",food:"식비",admissions:"관광/입장료",localTransport:"현지 이동",reserve:"기타/예비비"};
    for(const [key,value] of Object.entries(result.parts)){
      const li=document.createElement("li"), label=document.createElement("span"), valueLabel=document.createElement("strong");
      label.textContent=names[key]; valueLabel.textContent=money(value); li.append(label,valueLabel); ul.append(li);
    }
    view.append(title,big,ul,notice);
  } catch(e) {el("budget-result").textContent=e.message;}
});
load();
