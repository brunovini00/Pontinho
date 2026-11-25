const namesList = new Intl.ListFormat("pt-BR");

export function eliminationMessage(names: string[]) {
  const action = names.length === 1 ? "saiu" : "saíram";
  return `${namesList.format(names)} ${action} da mesa.`;
}

export default function RoundResult({ winner, eliminated }: { winner: string; eliminated: string[] }) {
  return (
    <div className="round-result" role="status">
      <p className="result-note">
        <span className="result-card" aria-hidden="true">♠</span>
        <span><strong>{winner} venceu</strong> a rodada.</span>
      </p>
      {eliminated.length > 0 && (
        <p className="result-note elimination-note">
          <span className="result-card result-card-out" aria-hidden="true"><span className="skull-mark" /></span>
          <span>{eliminationMessage(eliminated)}</span>
        </p>
      )}
    </div>
  );
}

export function ChampionCards() {
  return (
    <div className="celebration-deck" aria-hidden="true">
      <div className="celebration-ring" />
      <div className="celebration-card"><small>K</small>♦</div>
      <div className="celebration-card"><small>Q</small>♥</div>
      <div className="celebration-card"><small>A</small>♠</div>
    </div>
  );
}
