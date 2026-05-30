import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'cd_home_promo_dismissed_v1';

interface DismissalPayload {
  campaignId: number;
  contentVersion: number;
  localDate: string;
}

@Injectable({ providedIn: 'root' })
export class HomePromotionDismissalStorage {
  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  isDismissedToday(campaignId: number, contentVersion: number): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return false;
      }
      const o = JSON.parse(raw) as DismissalPayload;
      const today = new Date().toISOString().slice(0, 10);
      return o.localDate === today && o.campaignId === campaignId && o.contentVersion === contentVersion;
    } catch {
      return false;
    }
  }

  saveDismissedToday(campaignId: number, contentVersion: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const payload: DismissalPayload = {
        campaignId,
        contentVersion,
        localDate: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / private mode */
    }
  }
}
