/** Client-side estimate preview helpers (mirrors backend rate types). */

export type RateType = "HOURLY" | "FLAT" | "CHARGE_TIME" | "FLAT_RATE" | "QUANTITY";

export function boatLoaFt(loaFt: number, loaIn: number): number {
  return loaFt + loaIn / 12;
}
