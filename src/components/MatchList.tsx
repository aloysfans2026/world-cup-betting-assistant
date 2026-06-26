import type { Match } from "../domain/types";
import type { ManualOddsByMatchId, ManualOddsInput } from "../services/oddsService";

export function MatchList({
  matches,
  manualOdds,
  onOddsChange,
  onSelect,
}: {
  matches: Match[];
  manualOdds: ManualOddsByMatchId;
  onOddsChange: (matchId: string, field: keyof ManualOddsInput, value: string) => void;
  onSelect: (match: Match) => void;
}) {
  if (matches.length === 0) {
    return <p className="empty-state">今日暂无世界杯赛事。</p>;
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <article className="match-card" key={match.id}>
          <button className="match-row" onClick={() => onSelect(match)}>
            <span>{match.kickoffTime}</span>
            <strong>
              {match.homeTeam.name} VS {match.awayTeam.name}
            </strong>
            <em>
              {match.stage ?? "世界杯"} · {match.group ?? "分组待定"} · {match.status} ·{" "}
              {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
            </em>
          </button>
          <div className="odds-grid" aria-label={`${match.homeTeam.name}赔率录入`}>
            <label>
              <span>{match.homeTeam.name}主胜赔率</span>
              <input
                inputMode="decimal"
                min="1.01"
                step="0.01"
                type="number"
                value={manualOdds[match.id]?.homeWin ?? ""}
                placeholder={match.odds?.homeWin ? String(match.odds.homeWin) : "手动填入"}
                onChange={(event) => onOddsChange(match.id, "homeWin", event.target.value)}
              />
            </label>
            <label>
              <span>{match.homeTeam.name}平局赔率</span>
              <input
                inputMode="decimal"
                min="1.01"
                step="0.01"
                type="number"
                value={manualOdds[match.id]?.draw ?? ""}
                placeholder={match.odds?.draw ? String(match.odds.draw) : "手动填入"}
                onChange={(event) => onOddsChange(match.id, "draw", event.target.value)}
              />
            </label>
            <label>
              <span>{match.homeTeam.name}客胜赔率</span>
              <input
                inputMode="decimal"
                min="1.01"
                step="0.01"
                type="number"
                value={manualOdds[match.id]?.awayWin ?? ""}
                placeholder={match.odds?.awayWin ? String(match.odds.awayWin) : "手动填入"}
                onChange={(event) => onOddsChange(match.id, "awayWin", event.target.value)}
              />
            </label>
          </div>
          {!match.odds && <p className="odds-warning">缺少赔率，暂不建议下注</p>}
          {manualOdds[match.id]?.source === "ocr" && (
            <p className="odds-source">赔率来自截图识别，请人工核对</p>
          )}
        </article>
      ))}
    </div>
  );
}
