import { cities } from "@geoclash/data";
import type { PlayerView } from "@geoclash/runtime";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { MAP_H, MAP_W, capPath, landPath, nearestCity, project, screenToMap, spherePath } from "./geo";
import { fitPoints, useMapGestures } from "./useMapGestures";

interface Props {
  view: PlayerView;
  /** Ville choisie (en attente de confirmation du saut). */
  pendingCityId: number | null;
  onCityTap: (cityId: number) => void;
}

const points = cities.map((c) => project(c.lat, c.lng));

/** Carte du monde : côtes, zone rouge, villes (sûres / rouges / atteignables), joueurs, pan & zoom. */
export function WorldMap({ view, pendingCityId, onCityTap }: Props) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 520 });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const viewH = (MAP_W * size.h) / size.w;
  const unitPerPx = MAP_W / size.w; // 1 px écran = unitPerPx unités de vue
  const transformRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const reachRef = useRef<number[]>([]);
  const g = useMapGestures(
    viewH,
    () => unitPerPx,
    (cx, cy) => {
      const el = box.current;
      if (!el || reachRef.current.length === 0) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const [mx, my] = screenToMap(cx, cy, rect, transformRef.current);
      const hit = nearestCity(mx, my, reachRef.current, points, 30, rect.width, transformRef.current.scale);
      if (hit !== null) onCityTap(hit);
    },
  );
  transformRef.current = g.transform;
  const { scale } = g.transform;
  const px = (n: number) => (n * unitPerPx) / scale; // taille constante à l'écran

  // Cadrage automatique selon la phase
  const fitKey = `${view.phase}:${view.round}:${view.mode}:${view.you.cityId}`;
  const lastFit = useRef("");
  useEffect(() => {
    if (lastFit.current === fitKey) return;
    lastFit.current = fitKey;
    const me = points[view.you.cityId];
    let target: [number, number][] = [me];
    if (view.phase === "MOVE" || view.phase === "REVEAL") target = [me, ...view.you.reachable.map((c) => points[c])];
    const z = view.preview ?? view.zone;
    if (view.phase === "ZONE" && z) target = z.safe.map((c) => points[c]).concat([me]);
    g.setTransform(fitPoints(target, viewH, view.phase === "INTRO" ? 240 : 90, view.phase === "INTRO" ? 3 : 5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, viewH]);

  const safeSet = useMemo(() => new Set(view.zone?.safe ?? []), [view.zone]);
  const reach = useMemo(() => new Set(view.you.reachable), [view.you.reachable]);
  reachRef.current = view.phase === "MOVE" && !view.you.moved ? view.you.reachable : [];
  const zone = view.zone;
  const preview = view.preview;
  const zonePath = zone && !zone.final ? capPath(zone.centerLat, zone.centerLng, zone.radiusKm) : "";
  const previewPath = preview && !preview.final ? capPath(preview.centerLat, preview.centerLng, preview.radiusKm) : "";
  const finalPoint = view.finaleCityId !== null ? points[view.finaleCityId] : null;
  const previewFinalPoint = preview?.final ? project(preview.centerLat, preview.centerLng) : null;

  const showLabels = scale >= 2.2;

  return (
    <div className="map" ref={box} data-testid="world-map">
      <svg
        viewBox={`0 0 ${MAP_W} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Carte du monde"
        {...g.handlers}
      >
        <g
          className="map__layer"
          transform={`translate(${g.transform.tx} ${g.transform.ty}) scale(${g.transform.scale})`}
        >
          <path d={spherePath} className="map__ocean" />
          <path d={landPath} className="map__land" />

          {zone && (
            <>
              <defs>
                <mask id="zone-hole">
                  <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="white" />
                  {zonePath && <path d={zonePath} fill="black" />}
                  {zone.final && finalPoint && <circle cx={finalPoint[0]} cy={finalPoint[1]} r={px(16)} fill="black" />}
                </mask>
              </defs>
              <rect x="0" y="0" width={MAP_W} height={MAP_H} className="map__danger" mask="url(#zone-hole)" />
              {zonePath && <path d={zonePath} className="map__zone-edge" strokeWidth={px(2)} />}
            </>
          )}
          {previewPath && <path d={previewPath} className="map__preview-edge" strokeWidth={px(2)} strokeDasharray={`${px(8)} ${px(6)}`} />}
          {previewFinalPoint && (
            <circle cx={previewFinalPoint[0]} cy={previewFinalPoint[1]} r={px(20)} className="map__preview-edge" strokeWidth={px(2)} strokeDasharray={`${px(6)} ${px(5)}`} />
          )}

          {cities.map((c) => {
            const [x, y] = points[c.id];
            const red = zone ? !safeSet.has(c.id) : false;
            const isYou = c.id === view.you.cityId;
            const isReach = reach.has(c.id);
            const isPending = pendingCityId === c.id;
            const count = view.cityCounts[c.id] ?? 0;
            const r = px(isYou ? 7 : isReach ? 6 : 3.6);
            const cls = [
              "city",
              red ? "city--red" : zone ? "city--safe" : "",
              isReach ? "city--reach" : "",
              isPending ? "city--pending" : "",
              isYou ? "city--you" : "",
              c.id === view.finaleCityId ? "city--final" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g key={c.id} className={cls} data-city={c.id} data-testid={`city-${c.id}`}>
                {red ? (
                  <rect
                    x={x - r}
                    y={y - r}
                    width={r * 2}
                    height={r * 2}
                    transform={`rotate(45 ${x} ${y})`}
                    className="city__dot"
                  />
                ) : (
                  <circle cx={x} cy={y} r={r} className="city__dot" />
                )}
                {isYou && <circle cx={x} cy={y} r={px(13)} className="city__ring" strokeWidth={px(2)} />}
                {isPending && <circle cx={x} cy={y} r={px(15)} className="city__pending-ring" strokeWidth={px(3)} />}
                {count >= 2 && (
                  <text x={x + px(6)} y={y - px(6)} fontSize={px(10)} className="city__count">
                    {count}
                  </text>
                )}
                {(isYou || isPending || (showLabels && (isReach || count >= 2))) && (
                  <text x={x} y={y + px(isYou ? 22 : 18)} fontSize={px(11)} textAnchor="middle" className="city__label">
                    {isYou ? t("game.you") : c.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="map__controls">
        <button type="button" aria-label={t("game.zoomIn")} onClick={() => g.zoomBy(1.5)}>
          +
        </button>
        <button type="button" aria-label={t("game.zoomOut")} onClick={() => g.zoomBy(1 / 1.5)}>
          −
        </button>
        <button
          type="button"
          aria-label={t("game.recenter")}
          onClick={() => g.setTransform(fitPoints([points[view.you.cityId], ...view.you.reachable.map((c) => points[c])], viewH, 90, 5))}
        >
          ◎
        </button>
      </div>
    </div>
  );
}
