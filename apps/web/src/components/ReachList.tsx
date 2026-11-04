import { cities } from "@geoclash/data";
import { haversine } from "@geoclash/engine";
import type { PlayerView } from "@geoclash/runtime";
import { useMemo } from "react";
import { useI18n } from "../i18n";

interface Props {
  view: PlayerView;
  pending: number | null;
  onPick: (cityId: number) => void;
  max?: number;
}

/**
 * Liste des villes atteignables, triées par intérêt (dans la prochaine zone d'abord, puis proximité).
 * Alternative fiable au toucher sur la carte (petits écrans, accessibilité, clavier).
 */
export function ReachList({ view, pending, onPick, max = 36 }: Props) {
  const { t } = useI18n();
  const items = useMemo(() => {
    const z = view.preview ?? view.zone;
    const safe = new Set(z?.safe ?? []);
    const ref = z ? { lat: z.centerLat, lng: z.centerLng } : { lat: cities[view.you.cityId].lat, lng: cities[view.you.cityId].lng };
    return view.you.reachable
      .map((id) => ({
        id,
        inZone: z ? safe.has(id) : false,
        d: haversine(ref.lat, ref.lng, cities[id].lat, cities[id].lng),
      }))
      .sort((a, b) => Number(b.inZone) - Number(a.inZone) || a.d - b.d)
      .slice(0, max);
  }, [view.preview, view.zone, view.you.reachable, view.you.cityId, max]);

  if (items.length === 0) return null;
  return (
    <ul className="reach" aria-label={t("game.pickList")}>
      {items.map((it) => (
        <li key={it.id}>
          <button
            type="button"
            className={`reach__chip${pending === it.id ? " reach__chip--on" : ""}${it.inZone ? " reach__chip--safe" : ""}`}
            aria-pressed={pending === it.id}
            title={it.inZone ? t("game.inNextZone") : undefined}
            onClick={() => onPick(it.id)}
          >
            {it.inZone ? "🟢 " : ""}
            {cities[it.id].name}
          </button>
        </li>
      ))}
    </ul>
  );
}
