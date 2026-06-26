import type { Match } from "../domain/types";

function formatOdd(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return <p className="empty-state">今日暂无世界杯比赛。</p>;
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <article className="match-card" key={match.id}>
          <div className="match-row">
            <span>{match.kickoffTime}</span>
            <strong>
              {match.homeTeam.name} VS {match.awayTeam.name}
            </strong>
            <em>
              {match.stage ?? "世界杯"} · {match.group ?? "分组待定"} · {match.status} ·{" "}
              {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
            </em>
          </div>

          {match.odds && (
            <div className="odds-pills" aria-label={`${match.homeTeam.name}对${match.awayTeam.name}赔率`}>
              <span>主胜 {formatOdd(match.odds.homeWin)}</span>
              <span>平 {formatOdd(match.odds.draw)}</span>
              <span>客胜 {formatOdd(match.odds.awayWin)}</span>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
