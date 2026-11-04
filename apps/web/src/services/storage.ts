/**
 * Stockage clé/valeur asynchrone. Web : localStorage (avec repli mémoire).
 * Natif (Capacitor) : plugin Preferences, plus durable que localStorage que l'OS peut purger.
 */
export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export class MemoryStorage implements KeyValueStorage {
  private data = new Map<string, string>();
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.data.set(key, value);
  }
  async remove(key: string) {
    this.data.delete(key);
  }
}

export class WebStorage implements KeyValueStorage {
  private fallback = new MemoryStorage();
  async get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return this.fallback.get(key);
    }
  }
  async set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      await this.fallback.set(key, value);
    }
  }
  async remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      await this.fallback.remove(key);
    }
  }
}

class NativeStorage implements KeyValueStorage {
  private async prefs() {
    return (await import("@capacitor/preferences")).Preferences;
  }
  async get(key: string) {
    return (await (await this.prefs()).get({ key })).value;
  }
  async set(key: string, value: string) {
    await (await this.prefs()).set({ key, value });
  }
  async remove(key: string) {
    await (await this.prefs()).remove({ key });
  }
}

export async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function createStorage(): Promise<KeyValueStorage> {
  return (await isNativePlatform()) ? new NativeStorage() : new WebStorage();
}
