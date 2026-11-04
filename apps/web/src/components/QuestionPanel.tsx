import type { PlayerView } from "@geoclash/runtime";
import { useEffect, useState } from "react";
import { useI18n, type MessageKey } from "../i18n";

interface Props {
  view: PlayerView;
  onAnswer: (index: number) => void;
}

export function QuestionPanel({ view, onAnswer }: Props) {
  const { t } = useI18n();
  const q = view.question;
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [q?.id]);
  if (!q) return null;

  const reveal = view.reveal;
  const inQuestion = view.phase === "QUESTION";
  const catKey = `cat.${q.category}` as MessageKey;

  return (
    <div className="panel">
      <div className="panel__meta">
        <span className="chip">{t(catKey) === catKey ? q.category : t(catKey)}</span>
        {inQuestion && <span className="panel__hint">{t("game.answerFast")}</span>}
      </div>
      <h2 className="question" role="status">
        {q.text}
      </h2>
      <div className="options" role="group" aria-label="Réponses">
        {q.options.map((opt, i) => {
          let cls = "opt";
          if (reveal) {
            if (i === reveal.correctIndex) cls += " opt--correct";
            else if (i === reveal.yourIndex) cls += " opt--wrong";
          } else if (picked === i) cls += " opt--picked";
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={!inQuestion || picked !== null || !view.you.alive}
              onClick={() => {
                setPicked(i);
                onAnswer(i);
              }}
            >
              <span className="opt__letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {reveal && view.you.alive !== undefined && (
        <div className={`result ${reveal.correct ? "result--ok" : "result--ko"}`} role="status">
          <strong>
            {reveal.correct ? t("game.correct") : reveal.yourIndex === null ? t("game.timeout") : t("game.wrong")}
          </strong>
          {view.mode === "round" && (
            <span>
              {" "}
              · {t(`game.band.${reveal.band}` as MessageKey)}
              {reveal.band !== "FAIL" && ` (${t("game.range", { n: view.you.range })})`}
              {reveal.elapsedMs !== null && ` · ${t("game.elapsed", { n: (reveal.elapsedMs / 1000).toFixed(1) })}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
