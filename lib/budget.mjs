// Amounts are in whole KRW and are explicitly supplied by the user, not live quotes.
const isInt = (v) => Number.isSafeInteger(v) && v >= 0;
export function estimateBudget(input) {
  const { people, days, nights, rooms, transport, roomNight,
    foodDaily, admissions, localTransport, reserve } = input;
  if (![people, days, rooms].every(v => Number.isSafeInteger(v) && v > 0)) {
    throw new RangeError("인원·일수·객실 수는 1 이상이어야 합니다.");
  }
  if (!Number.isSafeInteger(nights) || nights < 0 || nights > days) {
    throw new RangeError("숙박 박수는 0 이상 여행 일수 이하여야 합니다.");
  }
  if (![transport, roomNight, foodDaily, admissions, localTransport, reserve].every(isInt)) {
    throw new RangeError("예산 항목은 0 이상의 원 단위 정수여야 합니다.");
  }
  const parts = {
    transport: people * transport,
    lodging: nights * rooms * roomNight,
    food: days * people * foodDaily,
    admissions: people * admissions,
    localTransport: people * localTransport,
    reserve,
  };
  const total = Object.values(parts).reduce((s, v) => s + v, 0);
  if (!Number.isSafeInteger(total)) throw new RangeError("계산 범위 초과");
  return { parts, total, price_status: "estimate", currency: "KRW" };
}
