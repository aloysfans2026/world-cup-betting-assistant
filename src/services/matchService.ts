import { todayMatches } from "../fixtures/worldCupMatches";
import type { Match } from "../domain/types";

export async function getTodayMatches(): Promise<Match[]> {
  return structuredClone(todayMatches);
}
