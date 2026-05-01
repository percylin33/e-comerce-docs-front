import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { MatIconModule } from '@angular/material/icon';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subject, interval, takeUntil } from 'rxjs';

const ONBOARDING_CONFIG = {
  SCROLL_THRESHOLD_PX: 300,
  STORAGE_KEY: 'cd_onboarding_nudge_dismissed_v1',
  ANIMATION_DURATION: 400,
  POLL_INTERVAL: 300,
} as const;

@Component({
  selector: 'ngx-onboarding-nudge',
  standalone: true,
  imports: [CommonModule, NbButtonModule, NbIconModule, MatIconModule],
  templateUrl: './onboarding-nudge.component.html',
  styleUrls: ['./onboarding-nudge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class OnboardingNudgeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);

  private destroy$ = new Subject<void>();
  private unlistenFns: Array<() => void> = [];
  private overlayRef: OverlayRef | null = null;

  isVisible = false;
  isDismissed = false;
  isAnimating = false;

  @ViewChild('nudgeContent', { static: true }) nudgeContent!: TemplateRef<unknown>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    this.checkPersistence();
    if (this.isDismissed) {
      console.log('[Nudge] ⛔ Already dismissed via localStorage');
      return;
    }
    console.log('[Nudge] ✅ Not dismissed - setting up scroll detection');
    this.setupScrollDetection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unlistenFns.forEach(fn => fn());
    this.disposeOverlay();
  }

  private setupScrollDetection(): void {
    const checkAndTrigger = () => {
      if (this.isDismissed || this.isVisible) { return; }
      const px = this.getScrollY();
      if (px > ONBOARDING_CONFIG.SCROLL_THRESHOLD_PX) {
        console.log('[Nudge] ✅ Scroll threshold reached:', px, 'px');
        this.showNudge();
      }
    };

    const candidates = [
      document.querySelector<HTMLElement>('nb-layout .layout .layout-container .content'),
      document.querySelector<HTMLElement>('.scrollable-container'),
      document.querySelector<HTMLElement>('nb-layout-column'),
      document.querySelector<HTMLElement>('[nbLayoutColumn]'),
    ].filter(Boolean) as HTMLElement[];

    candidates.push(document.documentElement, document.body);

    candidates.forEach((el, i) => {
      console.log('[Nudge] Registering scroll listener #' + i + ' on <' + el.tagName + (el.className ? '.' + el.className.split(' ')[0] : '') + '>');
      this.zone.runOutsideAngular(() => {
        const unlisten = this.renderer.listen(el, 'scroll', () => {
          this.zone.run(() => checkAndTrigger());
        });
        this.unlistenFns.push(unlisten);
      });
      if (el === document.documentElement) {
        this.zone.runOutsideAngular(() => {
          const unlisten = this.renderer.listen(window, 'scroll', () => {
            this.zone.run(() => checkAndTrigger());
          });
          this.unlistenFns.push(unlisten);
        });
      }
    });

    this.zone.runOutsideAngular(() => {
      const handler = () => this.zone.run(() => checkAndTrigger());
      document.addEventListener('scroll', handler, { capture: true, passive: true });
      this.unlistenFns.push(() => document.removeEventListener('scroll', handler, { capture: true }));
    });

    interval(ONBOARDING_CONFIG.POLL_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isDismissed || this.isVisible) { return; }
        const px = this.getScrollY();
        if (px > ONBOARDING_CONFIG.SCROLL_THRESHOLD_PX) {
          console.log('[Nudge] ✅ Polling detected scroll:', px, 'px');
          this.showNudge();
        }
      });

    setTimeout(() => {
      const px = this.getScrollY();
      console.log('[Nudge] Delayed check - scrollY:', px, 'px');
      if (px > ONBOARDING_CONFIG.SCROLL_THRESHOLD_PX && !this.isDismissed) {
        console.log('[Nudge] ✅ Already scrolled past threshold');
        this.showNudge();
      }
    }, 2000);
  }

  private getScrollY(): number {
    const w = window.scrollY || document.documentElement.scrollTop || 0;
    if (w > 0) { return w; }
    const content = document.querySelector<HTMLElement>('nb-layout .layout .layout-container .content');
    if (content && content.scrollTop > 0) { return content.scrollTop; }
    const scrollable = document.querySelector<HTMLElement>('.scrollable-container');
    if (scrollable && scrollable.scrollTop > 0) { return scrollable.scrollTop; }
    const column = document.querySelector<HTMLElement>('nb-layout-column');
    if (column && column.scrollTop > 0) { return column.scrollTop; }
    const allScrollable = document.querySelectorAll<HTMLElement>('[style*="overflow"]');
    for (const el of Array.from(allScrollable)) {
      if (el.scrollTop > 0) { return el.scrollTop; }
    }
    return 0;
  }

  showNudge(): void {
    if (this.isDismissed || this.isAnimating || this.isVisible) {
      console.log('[Nudge] showNudge blocked - dismissed:', this.isDismissed, 'animating:', this.isAnimating, 'visible:', this.isVisible);
      return;
    }
    console.log('[Nudge] 🎉 Showing nudge via CDK Overlay (appended to document.body)');
    this.isAnimating = true;
    this.isVisible = true;

    const positionStrategy = this.overlay.position()
      .global()
      .bottom('20px')
      .centerHorizontally();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      hasBackdrop: false,
      panelClass: ['onboarding-nudge-overlay-panel', 'onboarding-nudge-overlay-panel--visible'],
      width: '100%',
      maxWidth: '900px',
    });

    const portal = new TemplatePortal(this.nudgeContent, this.viewContainerRef);
    this.overlayRef.attach(portal);

    this.announceToScreenReader('Mensaje de ayuda disponible');
  }

  hideNudge(): void {
    console.log('[Nudge] Hiding nudge');
    this.isVisible = false;
    this.disposeOverlay();
    setTimeout(() => {
      this.isAnimating = false;
    }, ONBOARDING_CONFIG.ANIMATION_DURATION);
  }

  onDismiss(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    console.log('[Nudge] Dismissed by user');
    this.hideNudge();
    this.isDismissed = true;
    this.saveDismissalState();
  }

  onPrimaryAction(): void {
    console.log('[Nudge] CTA - navigating to tutorials');
    this.saveDismissalState();
    this.disposeOverlay();
    this.router.navigate(['/site/tutoriales']);
  }

  onSecondaryAction(): void {
    console.log('[Nudge] Help - navigating to contact');
    this.disposeOverlay();
    this.router.navigate(['/site/contacto']);
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private checkPersistence(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    try {
      this.isDismissed = localStorage.getItem(ONBOARDING_CONFIG.STORAGE_KEY) === 'true';
      console.log('[Nudge] checkPersistence - dismissed:', this.isDismissed, '| key exists:', localStorage.getItem(ONBOARDING_CONFIG.STORAGE_KEY) !== null);
    } catch { }
  }

  private saveDismissalState(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    try {
      localStorage.setItem(ONBOARDING_CONFIG.STORAGE_KEY, 'true');
      console.log('[Nudge] Saved dismissal to localStorage');
    } catch { }
  }

  private announceToScreenReader(message: string): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    const el = this.renderer.createElement('div');
    this.renderer.setAttribute(el, 'role', 'status');
    this.renderer.setAttribute(el, 'aria-live', 'polite');
    this.renderer.addClass(el, 'sr-only');
    this.renderer.setProperty(el, 'textContent', message);
    this.renderer.appendChild(document.body, el);
    setTimeout(() => this.renderer.removeChild(document.body, el), 1000);
  }
}
