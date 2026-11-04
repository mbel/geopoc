import { isNativePlatform } from "./storage";

export type HapticKind = "light" | "success" | "error";

/** Retour haptique : plugin natif sur mobile, vibration courte sur le web si disponible. Jamais bloquant. */
export async function haptic(kind: HapticKind): Promise<void> {
  try {
    if (await isNativePlatform()) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (kind === "light") await Haptics.impact({ style: ImpactStyle.Light });
      else await Haptics.notification({ type: kind === "success" ? NotificationType.Success : NotificationType.Error });
      return;
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(kind === "error" ? [40, 40, 40] : 20);
  } catch {
    /* silencieux */
  }
}
