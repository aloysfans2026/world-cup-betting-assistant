import type { Match } from "../domain/types";

export function MatchList({ matches, onSelect }: { matches: Match[]; onSelect: (match: Match) => void }) {
  if (matches.length === 0) {
    return <p className="empty-state">今日暂无世界杯赛事。</p>;
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <button className="match-row" key={match.id} onClick={() => onSelect(match)}>
          <span>{match.kickoffTime}</span>
          <strong>
            {match.homeTeam.name} VS {match.awayTeam.name}
          </strong>
          <em>{match.odds?.handicap ?? "盘口缺失"}</em>
        </button>
      ))}
    </div>
  );
}
