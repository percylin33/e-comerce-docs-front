// =============================================================================
// ONBOARDING NUDGE COMPONENT
// Scroll-triggered contextual help for new users
// =============================================================================

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { MatIconModule } from '@angular/material/icon';
import { Subject, fromEvent, merge, throttleTime, distinctUntilChanged, takeUntil, map } from 'rxjs';

// =============================================================================
// CONFIGURATION - TRIGGER RÁPIDO (10% scroll / 200px)
// =============================================================================

const ONBOARDING_CONFIG = {
  SCROLL_THRESHOLD: 0.10,        // 10% del scroll (rápido)
  MIN_SCROLL_PIXELS: 200,        // 200px mínimo
  STORAGE_KEY: 'cd_onboarding_nudge_dismissed_v1',
  ANIMATION_DURATION: 400,
  SCROLL_THROTTLE: 100,         // 100ms (más responsive)
} as const;

// =============================================================================
// COMPONENTE
// =============================================================================

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
  private elementRef = inject(ElementRef);

  private destroy$ = new Subject<void>();

  isVisible = false;
  isDismissed = false;
  isAnimating = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    this.checkPersistence();
    this.setupScrollHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // SCROLL HANDLING (Optimizado para Nebular)
  // ===========================================================================

  private setupScrollHandling(): void {
    // Detectar todos los contenedores scrollables en Nebular
    const containers = this.getScrollContainers();
    
    console.log('[OnboardingNudge] Setting up scroll on', containers.length, 'containers');

    if (containers.length === 0) {
      // Si no hay contenedores, usar window
      this.setupWindowScroll();
      return;
    }

    // Escuchar scroll en todos los contenedores
    const scrollObservables = containers.map(container =>
      fromEvent(container, 'scroll').pipe(
        throttleTime(ONBOARDING_CONFIG.SCROLL_THROTTLE),
        map(() => {
          const pct = this.calculateScrollPct(container);
          console.log('[OnboardingNudge] Scroll:', container.tagName, 'pct:', pct.toFixed(3));
          return pct;
        })
      )
    );

    merge(...scrollObservables)
      .pipe(
        throttleTime(ONBOARDING_CONFIG.SCROLL_THROTTLE),
        map(pct => pct >= ONBOARDING_CONFIG.SCROLL_THRESHOLD),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(shouldShow => {
        if (shouldShow && !this.isVisible && !this.isDismissed) {
          console.log('[OnboardingNudge] ✅ THRESHOLD REACHED - Showing nudge!');
          this.showNudge();
        }
      });

    // Check inicial
    requestAnimationFrame(() => {
      const pct = this.getCurrentScrollPct();
      console.log('[OnboardingNudge] Initial scroll pct:', pct.toFixed(3));
      if (pct >= ONBOARDING_CONFIG.SCROLL_THRESHOLD && !this.isDismissed) {
        setTimeout(() => this.showNudge(), 300);
      }
    });
  }

  private setupWindowScroll(): void {
    fromEvent(window, 'scroll').pipe(
      throttleTime(ONBOARDING_CONFIG.SCROLL_THROTTLE),
      map(() => {
        const top = window.scrollY || document.documentElement.scrollTop;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        return h > 0 ? top / h : 0;
      }),
      map(pct => pct >= ONBOARDING_CONFIG.SCROLL_THRESHOLD),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(shouldShow => {
      if (shouldShow && !this.isVisible && !this.isDismissed) {
        console.log('[OnboardingNudge] ✅ Window scroll threshold - Showing nudge!');
        this.showNudge();
      }
    });
  }

  private getScrollContainers(): HTMLElement[] {
    const containers: HTMLElement[] = [];

    // Contenedores Nebular
    const nbContent = document.querySelector<HTMLElement>('nb-layout .layout .layout-container .content');
    if (nbContent) containers.push(nbContent);

    const scrollable = document.querySelectorAll<HTMLElement>('.scrollable');
    scrollable.forEach(el => containers.push(el));

    // Window como fallback
    containers.push(document.documentElement);

    return containers;
  }

  private calculateScrollPct(container: HTMLElement): number {
    const top = container.scrollTop;
    const max = container.scrollHeight - container.clientHeight;
    return max > 0 ? top / max : 0;
  }

  private getCurrentScrollPct(): number {
    for (const c of this.getScrollContainers()) {
      const pct = this.calculateScrollPct(c);
      if (pct > 0) return pct;
    }
    return 0;
  }

  // ===========================================================================
  // VISUALIZACIÓN
  // ===========================================================================

  showNudge(): void {
    if (this.isAnimating || this.isDismissed || this.isVisible) { return; }
    this.isAnimating = true;
    this.isVisible = true;
    console.log('[OnboardingNudge] 🎉 Nudge is now VISIBLE');
    this.announceToScreenReader('Mensaje de ayuda disponible');
  }

  hideNudge(): void {
    if (this.isAnimating) { return; }
    this.isAnimating = true;
    this.isVisible = false;
    setTimeout(() => this.isAnimating = false, ONBOARDING_CONFIG.ANIMATION_DURATION);
  }

  // ===========================================================================
  // INTERACCIONES
  // ===========================================================================

  onDismiss(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    console.log('[OnboardingNudge] Dismissed by user');
    this.hideNudge();
    this.isDismissed = true;
    this.saveDismissalState();
  }

  onPrimaryAction(): void {
    console.log('[OnboardingNudge] CTA clicked - navigating to tutorials');
    this.saveDismissalState();
    this.router.navigate(['/site/tutoriales']);
  }

  onSecondaryAction(): void {
    console.log('[OnboardingNudge] Help clicked - navigating to contact');
    this.router.navigate(['/site/contacto']);
  }

  // ===========================================================================
  // PERSISTENCIA
  // ===========================================================================

  private checkPersistence(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    try {
      this.isDismissed = localStorage.getItem(ONBOARDING_CONFIG.STORAGE_KEY) === 'true';
      if (this.isDismissed) {
        console.log('[OnboardingNudge] Previously dismissed, will not show');
      }
    } catch { }
  }

  private saveDismissalState(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }
    try {
      localStorage.setItem(ONBOARDING_CONFIG.STORAGE_KEY, 'true');
    } catch { }
  }

  // ===========================================================================
  // ACCESIBILIDAD
  // ===========================================================================

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
