import type { Match } from "../domain/types";
import { getTeamFlag } from "../services/teamFlagService";

function formatOdd(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return <p className="empty-state">今日暂无世界杯比赛。</p>;
  }

  const statusText = (match: Match): string => {
    if (match.status === "进行中") return "比赛进行中";
    if (match.status === "已结束" && match.homeScore !== null && match.awayScore !== null) {
      return `${match.homeScore}:${match.awayScore}`;
    }
    if (match.status === "已结束") return "已结束";
    if (!/^\d{2}:\d{2}$/.test(match.kickoffTime)) return "时间待定";
    return `${match.kickoffTime} 开赛`;
  };

  return (
    <div className="match-list">
      {matches.map((match) => (
        <article className="match-card" key={match.id}>
          <div className="match-time" data-testid="match-kickoff">
            {statusText(match)}
          </div>
          <div className="match-teams">
            <div className="team-side">
              <span aria-hidden="true" className="team-flag">
                {getTeamFlag(match.homeTeam.name)}
              </span>
              <strong className="team-name">{match.homeTeam.name}</strong>
            </div>
            <span className="versus">VS</span>
            <div className="team-side">
              <span aria-hidden="true" className="team-flag">
                {getTeamFlag(match.awayTeam.name)}
              </span>
              <strong className="team-name">{match.awayTeam.name}</strong>
            </div>
          </div>
          <div className="match-meta">
            <span>
              {match.stage ?? "世界杯"} {match.group ?? "分组待定"}
            </span>
            <em>{match.status}</em>
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
