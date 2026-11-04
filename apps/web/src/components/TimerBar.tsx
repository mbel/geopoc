interface Props {
  startedAt: number;
  endsAt: number;
  now: number;
}

/** Barre de temps de la phase en cours (décroît de droite à gauche). */
export function TimerBar({ startedAt, endsAt, now }: Props) {
  const total = Math.max(1, endsAt - startedAt);
  const ratio = endsAt < 0 ? 0 : Math.min(1, Math.max(0, (endsAt - now) / total));
  const urgent = ratio < 0.25;
  return (
    <div className="timer" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
      <div className={`timer__fill${urgent ? " timer__fill--urgent" : ""}`} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}
