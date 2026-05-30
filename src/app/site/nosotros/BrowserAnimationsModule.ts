import { Directive, ElementRef, EventEmitter, Output, OnInit, inject } from '@angular/core';

@Directive({
    selector: '[ngxInViewport]',
    standalone: true
})
export class InViewportDirective implements OnInit {
  private el = inject(ElementRef);

  @Output() visible = new EventEmitter<boolean>();

  ngOnInit() {
    const observer = new IntersectionObserver(([entry]) => {
      this.visible.emit(entry.isIntersecting);
    }, { threshold: 0.1 });
    observer.observe(this.el.nativeElement);
  }
}