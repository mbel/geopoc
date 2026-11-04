import { useCallback, useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";
import { MAP_H, MAP_W } from "./geo";

export interface MapTransform {
  scale: number;
  tx: number;
  ty: number;
}

export const MIN_SCALE = 1;
export const MAX_SCALE = 12;

/** Maintient la carte dans le cadre (en unités de vue). */
export function clampTransform(t: MapTransform, viewH: number): MapTransform {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale));
  const minTx = MAP_W - MAP_W * scale;
  const tx = Math.min(0, Math.max(minTx, t.tx));
  const mapH = MAP_H * scale;
  let ty: number;
  if (mapH <= viewH) ty = (viewH - mapH) / 2;
  else ty = Math.min(0, Math.max(viewH - mapH, t.ty));
  return { scale, tx, ty };
}

/** Transformation qui cadre un ensemble de points (coordonnées de carte) dans la vue. */
export function fitPoints(points: [number, number][], viewH: number, padding = 70, maxScale = 6): MapTransform {
  if (points.length === 0) return clampTransform({ scale: 1, tx: 0, ty: 0 }, viewH);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const bw = Math.max(maxX - minX, 1) + 2 * padding;
  const bh = Math.max(maxY - minY, 1) + 2 * padding;
  const scale = Math.min(maxScale, Math.max(MIN_SCALE, Math.min(MAP_W / bw, viewH / bh)));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return clampTransform({ scale, tx: MAP_W / 2 - cx * scale, ty: viewH / 2 - cy * scale }, viewH);
}

/**
 * Déplacement (1 doigt / souris), pincement (2 doigts) et molette.
 * Les taps sont détectés ici (pointerup quasi immobile) et non via `click`, que la capture du pointeur peut détourner.
 */
export function useMapGestures(viewH: number, pxToUnit: () => number, onTap?: (clientX: number, clientY: number) => void) {
  const [t, setT] = useState<MapTransform>(() => clampTransform({ scale: 1, tx: 0, ty: 0 }, viewH));
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ dist: number; mx: number; my: number } | null>(null);
  const moved = useRef(0);
  const multi = useRef(false);
  const captured = useRef(false);
  const tapRef = useRef(onTap);
  tapRef.current = onTap;

  const apply = useCallback((next: MapTransform) => setT(clampTransform(next, viewH)), [viewH]);

  const zoomAt = useCallback(
    (factor: number, ux: number, uy: number) =>
      setT((cur) => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, cur.scale * factor));
        const k = scale / cur.scale;
        return clampTransform({ scale, tx: ux - (ux - cur.tx) * k, ty: uy - (uy - cur.ty) * k }, viewH);
      }),
    [viewH],
  );

  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (pointers.current.size === 0) {
      moved.current = 0;
      multi.current = false;
      captured.current = false;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) multi.current = true;
    last.current = null;
  };

  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const k = pxToUnit();
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      moved.current += Math.abs(dx) + Math.abs(dy);
      if (moved.current > 8 && !captured.current) {
        captured.current = true;
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch {
          /* jsdom */
        }
      }
      setT((c) => clampTransform({ ...c, tx: c.tx + dx * k, ty: c.ty + dy * k }, viewH));
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      moved.current += 10;
      if (last.current && last.current.dist > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        zoomAt(dist / last.current.dist, (mx - rect.left) * k, (my - rect.top) * k);
        setT((c) => clampTransform({ ...c, tx: c.tx + (mx - last.current!.mx) * k, ty: c.ty + (my - last.current!.my) * k }, viewH));
      }
      last.current = { dist, mx, my };
    }
  };

  const onPointerUp = (e: RPointerEvent<SVGSVGElement>) => {
    const wasTracked = pointers.current.has(e.pointerId);
    pointers.current.delete(e.pointerId);
    last.current = null;
    // Un « tap » = un seul doigt, quasi immobile, relâché : on ne dépend PAS de l'événement click
    // (qui est détourné par la capture du pointeur selon les navigateurs).
    if (wasTracked && e.type === "pointerup" && pointers.current.size === 0 && !multi.current && moved.current <= 8) {
      tapRef.current?.(e.clientX, e.clientY);
    }
  };

  const onWheel = (e: RWheelEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const k = pxToUnit();
    zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, (e.clientX - rect.left) * k, (e.clientY - rect.top) * k);
  };

  return {
    transform: t,
    setTransform: apply,
    zoomBy: (factor: number) => zoomAt(factor, MAP_W / 2, viewH / 2),
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel },
  };
}
