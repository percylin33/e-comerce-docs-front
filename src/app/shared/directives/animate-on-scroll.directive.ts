import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  AfterViewInit,
  inject,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Directiva ligera tipo AOS basada en IntersectionObserver.
 * Compatible con el scroll container de Nebular (`nb-layout .scrollable-container`)
 * porque IntersectionObserver detecta visibilidad real respecto al viewport,
 * sin depender del evento `scroll` de window.
 *
 * Uso:
 *   <section ngxAnimateOnScroll="fade-up" [aosDelay]="200">...</section>
 *   <div ngxAnimateOnScroll="zoom-in" aosOnce="false" [aosThreshold]="0.3">...</div>
 *
 * Animaciones disponibles (definidas en src/app/shared/styles/_animations-on-scroll.scss):
 *   fade-up | fade-down | fade-left | fade-right | zoom-in | zoom-out | flip-up
 */
@Directive({
  selector: '[ngxAnimateOnScroll]',
  standalone: true,
})
export class AnimateOnScrollDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  /** Tipo de animación. Default: fade-up. */
  @Input('ngxAnimateOnScroll') animation: string = 'fade-up';

  /** Retraso en ms antes de animar tras entrar en viewport. Default: 0. */
  @Input() aosDelay = 0;

  /** Duración en ms. Default: 600. */
  @Input() aosDuration = 600;

  /** Porcentaje visible (0-1) para disparar. Default: 0.15. */
  @Input() aosThreshold = 0.15;

  /** Si true (default), anima una sola vez. Si false, repite al re-entrar. */
  @Input() aosOnce = true;

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const node: HTMLElement = this.el.nativeElement;

    // Respeto a usuarios con prefers-reduced-motion.
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.renderer.addClass(node, 'aos-animate');
      return;
    }

    // Estado inicial.
    this.renderer.addClass(node, 'aos');
    this.renderer.addClass(node, `aos-${this.animation}`);
    this.renderer.setStyle(node, 'transition-duration', `${this.aosDuration}ms`);
    if (this.aosDelay > 0) {
      this.renderer.setStyle(node, 'transition-delay', `${this.aosDelay}ms`);
    }

    // Si IntersectionObserver no existe, mostramos sin animar.
    if (typeof IntersectionObserver === 'undefined') {
      this.renderer.addClass(node, 'aos-animate');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.renderer.addClass(node, 'aos-animate');
            if (this.aosOnce) {
              this.observer?.unobserve(node);
            }
          } else if (!this.aosOnce) {
            this.renderer.removeClass(node, 'aos-animate');
          }
        }
      },
      { threshold: this.aosThreshold, rootMargin: '0px 0px -5% 0px' }
    );

    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
