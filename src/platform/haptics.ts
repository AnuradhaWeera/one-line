import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/** Haptic feedback via Capacitor (native) with a vibration fallback on web. Never throws. */
export const haptics = {
  enabled: true,
  touch(): void {
    if (this.enabled) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  },
  win(): void {
    if (this.enabled) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  },
  fail(near: boolean): void {
    if (!this.enabled) return;
    Haptics.notification({ type: near ? NotificationType.Warning : NotificationType.Error }).catch(() => {});
  },
};
