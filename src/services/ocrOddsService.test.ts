import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { applyRecognizedOdds, matchRecognizedOddsToMatches, parseOddsFromOcrText } from "./ocrOddsService";

describe("ocrOddsService", () => {
  it("parses regular win draw loss odds from OCR text", () => {
    const rows = parseOddsFromOcrText(`
      周二001 加拿大 摩洛哥 1.82 3.20 4.10
      周二002 Brazil Haiti 1.12 6.50 12.00
    `);

    expect(rows).toEqual([
      {
        awayTeam: "摩洛哥",
        code: "周二001",
        awayWin: "4.10",
        draw: "3.20",
        homeTeam: "加拿大",
        homeWin: "1.82",
        id: expect.any(String),
        matchId: "",
        status: "待确认",
      },
      {
        awayTeam: "Haiti",
        code: "周二002",
        awayWin: "12.00",
        draw: "6.50",
        homeTeam: "Brazil",
        homeWin: "1.12",
        id: expect.any(String),
        matchId: "",
        status: "待确认",
      },
    ]);
  });

  it("matches recognized odds to today's matches with Chinese and English aliases", () => {
    const [canadaMatch, , , brazilMatch] = todayMatches;
    const recognized = parseOddsFromOcrText(`
      周二001 加拿大 摩洛哥 1.82 3.20 4.10
      周二004 Brazil Haiti 1.12 6.50 12.00
    `);

    const matched = matchRecognizedOddsToMatches(recognized, todayMatches);

    expect(matched[0]).toMatchObject({ matchId: canadaMatch.id, status: "已匹配" });
    expect(matched[1]).toMatchObject({ matchId: brazilMatch.id, status: "已匹配" });
  });

  it("keeps uncertain matches pending until the user confirms them", () => {
    const recognized = parseOddsFromOcrText("周二009 火星队 月球队 2.10 3.10 3.40");

    const [matched] = matchRecognizedOddsToMatches(recognized, todayMatches);

    expect(matched).toMatchObject({ matchId: "", status: "待确认" });
  });

  it("applies confirmed OCR odds to manual odds without touching pending rows", () => {
    const [canadaMatch] = todayMatches;
    const rows = matchRecognizedOddsToMatches(parseOddsFromOcrText("周二001 加拿大 摩洛哥 1.82 3.20 4.10"), todayMatches);
    rows.push({
      awayTeam: "月球队",
      awayWin: "3.40",
      code: "周二009",
      draw: "3.10",
      homeTeam: "火星队",
      homeWin: "2.10",
      id: "pending-row",
      matchId: "",
      status: "待确认",
    });

    const manualOdds = applyRecognizedOdds({}, rows);

    expect(manualOdds).toEqual({
      [canadaMatch.id]: {
        awayWin: "4.10",
        draw: "3.20",
        homeWin: "1.82",
        source: "ocr",
      },
    });
  });
});
