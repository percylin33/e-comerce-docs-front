import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatIconModule } from '@angular/material/icon';
import { NbButtonModule, NbToastrService } from '@nebular/theme';
import { Subject, timer } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { PromotionsPublicApi } from '../../data/promotions-public.api';
import { HomePromotionDismissalStorage } from '../../services/home-promotion-dismissal.storage';
import { HomePromotionCampaign, HomePromotionSlide } from '../../models/home-promotion.types';

type SwiperLite = {
  updateSize: () => void;
  updateSlides?: () => void;
  updateProgress?: () => void;
};

@Component({
  selector: 'ngx-home-promotion-popup',
  standalone: true,
  imports: [CommonModule, MatIconModule, NbButtonModule],
  templateUrl: './home-promotion-popup.component.html',
  styleUrls: ['./home-promotion-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePromotionPopupComponent implements OnInit, OnDestroy {
  @ViewChild('popupTpl', { static: true }) popupTpl!: TemplateRef<unknown>;

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly api = inject(PromotionsPublicApi);
  private readonly dismissal = inject(HomePromotionDismissalStorage);
  private readonly router = inject(Router);
  private readonly toastr = inject(NbToastrService);
  private readonly breakpoint = inject(BreakpointObserver);

  private readonly destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private swiperApi: { slidePrev?: () => void; slideNext?: () => void } | null = null;
  private promoResizeListener: (() => void) | null = null;
  private layoutRaf = 0;

  readonly isMobile = signal(false);
  readonly campaign = signal<HomePromotionCampaign | null>(null);

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.breakpoint
      .observe(['(max-width: 767.98px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.isMobile.set(state.matches);
        if (this.overlayRef) {
          this.scheduleSwiperLayoutRefresh();
        }
      });

    this.api
      .getHomePopup()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res?.result) {
            return;
          }
          const data = res.data;
          if (!data?.slides?.length) {
            return;
          }
          if (this.dismissal.isDismissedToday(data.campaignId, data.contentVersion)) {
            return;
          }
          this.campaign.set(data);
          const delayMs = Math.max(0, (data.showDelaySeconds ?? 4) * 1000);
          timer(delayMs)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.openOverlay());
        },
        error: () => {
          /* silencioso: promo opcional */
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disposeOverlay();
  }

  onSwiperInit(ev: Event): void {
    const detail = (ev as CustomEvent).detail;
    const swiper = Array.isArray(detail) ? detail[0] : (ev.target as { swiper?: unknown })?.swiper;
    this.swiperApi = swiper as typeof this.swiperApi;
    this.scheduleSwiperLayoutRefresh();
  }

  onPromoSlideChange(): void {
    this.scheduleSwiperLayoutRefresh();
  }

  onSlideImageLoad(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.classList.remove('home-promo__img--loading');
    this.scheduleSwiperLayoutRefresh();
  }

  /** En móvil usa imagen específica si existe; si no, la general. */
  slideMediaUrl(slide: HomePromotionSlide): string {
    if (this.isMobile()) {
      const m = slide.imageUrlMobile?.trim();
      if (m) {
        return m;
      }
    }
    return slide.imageUrl;
  }

  /** Tras cambiar ratio / slide / imagen, Swiper y el overlay recalculan sin hacks de ancho manual */
  private scheduleSwiperLayoutRefresh(): void {
    if (this.layoutRaf) {
      cancelAnimationFrame(this.layoutRaf);
    }
    this.layoutRaf = requestAnimationFrame(() => {
      this.layoutRaf = 0;
      this.refreshSwiperLayout();
    });
  }

  private refreshSwiperLayout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const pane = this.overlayRef?.overlayElement;
    const host = pane?.querySelector('swiper-container.home-promo__swiper') as
      | (HTMLElement & { swiper?: SwiperLite })
      | undefined;
    const sw = host?.swiper;
    if (sw) {
      sw.updateSize();
      sw.updateSlides?.();
      sw.updateProgress?.();
    }
    this.overlayRef?.updatePosition();
  }

  private clearPromoResizeListener(): void {
    if (this.promoResizeListener) {
      window.removeEventListener('resize', this.promoResizeListener);
      this.promoResizeListener = null;
    }
  }

  slidePrev(ev: Event): void {
    ev.preventDefault();
    this.swiperApi?.slidePrev?.();
  }

  slideNext(ev: Event): void {
    ev.preventDefault();
    this.swiperApi?.slideNext?.();
  }

  dismiss(): void {
    const c = this.campaign();
    if (c) {
      this.dismissal.saveDismissedToday(c.campaignId, c.contentVersion);
    }
    this.disposeOverlay();
  }

  onBackdropDismiss(): void {
    this.dismiss();
  }

  onCta(slide: HomePromotionSlide, ev: Event): void {
    ev.preventDefault();
    if (slide.buttonAction === 'LINK' && slide.linkUrl) {
      this.dismiss();
      this.navigateLink(slide.linkUrl, slide.openInNewTab);
    } else if (slide.buttonAction === 'COPY' && slide.copyText) {
      const text = slide.copyText;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(
          () => this.toastr.success('Listo', 'Copiado al portapapeles'),
          () => this.fallbackCopy(text),
        );
      } else {
        this.fallbackCopy(text);
      }
    }
  }

  private openOverlay(): void {
    if (this.overlayRef) {
      return;
    }
    const cmp = this.campaign();
    if (!cmp?.slides?.length) {
      return;
    }

    const mobile = this.isMobile();
    // En móvil usamos modal centrado (ancho = contenido) para que el popup se ajuste a la imagen.
    const positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      hasBackdrop: true,
      backdropClass: 'home-promo-backdrop',
      panelClass: ['home-promo-panel', 'home-promo-panel--modal'],
      width: 'auto',
      maxHeight: mobile ? '94vh' : '96vh',
      maxWidth: 'calc(100vw - 16px)',
    });

    const portal = new TemplatePortal(this.popupTpl, this.vcr);
    this.overlayRef.attach(portal);
    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onBackdropDismiss());

    const onResize = (): void => this.scheduleSwiperLayoutRefresh();
    this.promoResizeListener = onResize;
    window.addEventListener('resize', onResize, { passive: true });
    this.overlayRef
      .detachments()
      .pipe(take(1))
      .subscribe(() => this.clearPromoResizeListener());

    setTimeout(() => this.refreshSwiperLayout(), 0);
    setTimeout(() => this.refreshSwiperLayout(), 350);
  }

  private disposeOverlay(): void {
    this.clearPromoResizeListener();
    if (this.layoutRaf) {
      cancelAnimationFrame(this.layoutRaf);
      this.layoutRaf = 0;
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private navigateLink(url: string, newTab: boolean): void {
    if (/^https?:\/\//i.test(url)) {
      if (newTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
      return;
    }
    const path = url.startsWith('/') ? url : `/${url}`;
    void this.router.navigateByUrl(path);
  }

  private fallbackCopy(text: string): void {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.toastr.success('Listo', 'Copiado al portapapeles');
    } catch {
      this.toastr.danger('No se pudo copiar', 'Error');
    }
  }
}
