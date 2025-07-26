import { Directive, ElementRef, EventEmitter, Output, OnInit } from '@angular/core';

@Directive({
  selector: '[ngxInViewport]'
})
export class InViewportDirective implements OnInit {
  @Output() visible = new EventEmitter<boolean>();

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const observer = new IntersectionObserver(([entry]) => {
      this.visible.emit(entry.isIntersecting);
    }, { threshold: 0.1 });
    observer.observe(this.el.nativeElement);
  }
}