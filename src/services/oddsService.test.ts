import { describe, expect, it } from "vitest";
import { applyManualOdds, buildManualOdds } from "./oddsService";
import { todayMatches } from "../fixtures/worldCupMatches";

describe("oddsService", () => {
  it("builds app odds from complete manual win/draw/loss odds", () => {
    const odds = buildManualOdds({ homeWin: "1.82", draw: "3.20", awayWin: "4.10" });

    expect(odds).toMatchObject({
      homeWin: 1.82,
      draw: 3.2,
      awayWin: 4.1,
      recommendedDirection: "主胜",
      recommendedOdds: 1.82,
      marketMovement: "稳定",
    });
  });

  it("rejects partial or invalid manual odds", () => {
    expect(buildManualOdds({ homeWin: "1.82", draw: "", awayWin: "4.10" })).toBeUndefined();
    expect(buildManualOdds({ homeWin: "1", draw: "3.20", awayWin: "4.10" })).toBeUndefined();
    expect(buildManualOdds({ homeWin: "abc", draw: "3.20", awayWin: "4.10" })).toBeUndefined();
  });

  it("applies manual odds without mutating match data", () => {
    const match = { ...todayMatches[0], odds: undefined };
    const [withOdds] = applyManualOdds([match], {
      [match.id]: { homeWin: "2.10", draw: "3.00", awayWin: "3.80" },
    });

    expect(match.odds).toBeUndefined();
    expect(withOdds.odds).toMatchObject({ homeWin: 2.1, recommendedDirection: "主胜" });
  });
});
