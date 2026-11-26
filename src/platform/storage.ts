import { Preferences } from '@capacitor/preferences';

export interface Progress {
  /** Best star count per level id. */
  stars: Record<string, number>;
  muted: boolean;
  haptics: boolean;
}

const KEY = 'one-line.progress.v1';
const DEFAULTS: Progress = { stars: {}, muted: false, haptics: true };

/** Load saved progress. Uses native storage on device, localStorage on web; never throws. */
export async function loadProgress(): Promise<Progress> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(value) as Partial<Progress>;
    return { ...DEFAULTS, ...parsed, stars: { ...(parsed.stars ?? {}) } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export async function saveProgress(p: Progress): Promise<void> {
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify(p) });
  } catch {
    /* storage unavailable: progress lasts for this session only */
  }
}
