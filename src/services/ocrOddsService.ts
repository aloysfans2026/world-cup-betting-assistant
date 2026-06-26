import type { Match } from "../domain/types";
import type { ManualOddsByMatchId } from "./oddsService";

export type RecognizedOddsStatus = "已匹配" | "待确认";

export interface RecognizedOddsRow {
  id: string;
  code: string;
  homeTeam: string;
  awayTeam: string;
  homeWin: string;
  draw: string;
  awayWin: string;
  matchId: string;
  status: RecognizedOddsStatus;
}

const teamAliases: Record<string, string[]> = {
  阿根廷: ["argentina", "阿根廷"],
  澳大利亚: ["australia", "澳大利亚"],
  巴西: ["brazil", "巴西"],
  比利时: ["belgium", "比利时"],
  加拿大: ["canada", "加拿大"],
  克罗地亚: ["croatia", "克罗地亚"],
  丹麦: ["denmark", "丹麦"],
  英格兰: ["england", "英格兰"],
  法国: ["france", "法国"],
  德国: ["germany", "德国"],
  加纳: ["ghana", "加纳"],
  海地: ["haiti", "海地"],
  日本: ["japan", "日本"],
  约旦: ["jordan", "约旦"],
  摩洛哥: ["morocco", "摩洛哥"],
  墨西哥: ["mexico", "墨西哥"],
  挪威: ["norway", "挪威"],
  巴拿马: ["panama", "巴拿马"],
  波兰: ["poland", "波兰"],
  葡萄牙: ["portugal", "葡萄牙"],
  塞内加尔: ["senegal", "塞内加尔"],
  塞尔维亚: ["serbia", "塞尔维亚"],
  瑞士: ["switzerland", "swiss", "瑞士"],
  美国: ["usa", "united states", "美国"],
  乌兹别克斯坦: ["uzbekistan", "乌兹别克斯坦"],
  威尔士: ["wales", "威尔士"],
  阿尔及利亚: ["algeria", "阿尔及利亚"],
};

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, "")
    .trim();
}

function aliasesFor(teamName: string): string[] {
  const direct = teamAliases[teamName] ?? [];
  return [teamName, ...direct].map(normalizeToken).filter(Boolean);
}

function teamMatches(inputName: string, teamName: string): boolean {
  const input = normalizeToken(inputName);
  if (!input) return false;

  return aliasesFor(teamName).some((alias) => input === alias || input.includes(alias) || alias.includes(input));
}

function validOdd(value: string): boolean {
  const number = Number(value);
  return Number.isFinite(number) && number > 1;
}

function rowId(index: number, line: string): string {
  return `ocr-${index}-${normalizeToken(line).slice(0, 18)}`;
}

export function parseOddsFromOcrText(text: string): RecognizedOddsRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      const odds = line.match(/\d+(?:\.\d{1,2})/g) ?? [];
      if (odds.length < 3) return [];

      const [homeWin, draw, awayWin] = odds as [string, string, string, ...string[]];
      const firstOdd = line.indexOf(homeWin);
      const teamPart = line.slice(0, firstOdd).trim();
      const codeMatch = teamPart.match(/周[一二三四五六日天]\s*\d{3}|[0-9]{3}/);
      const code = codeMatch?.[0]?.replace(/\s+/g, "") ?? "";
      const teamText = code ? teamPart.replace(codeMatch?.[0] ?? "", "").trim() : teamPart;
      const teams = teamText.split(/\s+(?:VS|vs|v|V)?\s*|\s+[-—]\s+/).filter(Boolean);

      if (teams.length < 2 || !validOdd(homeWin) || !validOdd(draw) || !validOdd(awayWin)) return [];

      const [homeTeam, awayTeam] = teams as [string, string, ...string[]];

      return [
        {
          awayTeam,
          awayWin,
          code,
          draw,
          homeTeam,
          homeWin,
          id: rowId(index, line),
          matchId: "",
          status: "待确认",
        },
      ];
    });
}

function matchRowToMatch(row: RecognizedOddsRow, matches: Match[]): string {
  const candidates = matches.filter(
    (match) =>
      teamMatches(row.homeTeam, match.homeTeam.name) &&
      teamMatches(row.awayTeam, match.awayTeam.name),
  );

  if (candidates.length === 1) return candidates[0].id;

  const reversed = matches.filter(
    (match) =>
      teamMatches(row.homeTeam, match.awayTeam.name) &&
      teamMatches(row.awayTeam, match.homeTeam.name),
  );

  return reversed.length === 1 ? reversed[0].id : "";
}

export function matchRecognizedOddsToMatches(rows: RecognizedOddsRow[], matches: Match[]): RecognizedOddsRow[] {
  return rows.map((row) => {
    const matchId = row.matchId || matchRowToMatch(row, matches);
    return {
      ...row,
      matchId,
      status: matchId ? "已匹配" : "待确认",
    };
  });
}

export function applyRecognizedOdds(
  currentOdds: ManualOddsByMatchId,
  rows: RecognizedOddsRow[],
): ManualOddsByMatchId {
  return rows.reduce<ManualOddsByMatchId>((nextOdds, row) => {
    if (!row.matchId || !validOdd(row.homeWin) || !validOdd(row.draw) || !validOdd(row.awayWin)) return nextOdds;

    return {
      ...nextOdds,
      [row.matchId]: {
        awayWin: row.awayWin,
        draw: row.draw,
        homeWin: row.homeWin,
        source: "ocr",
      },
    };
  }, currentOdds);
}
