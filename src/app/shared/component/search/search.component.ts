import { Component, EventEmitter, OnInit, Output, AfterViewInit, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { Document, DocumentData } from '../../../@core/interfaces/documents';

@Component({
  selector: 'ngx-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements AfterViewInit, OnDestroy{
  @Output() searchPerformed = new EventEmitter<string>();
  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('suggestionsList') suggestionsList: ElementRef;

  searchTerm: string = '';
  suggestions: string[] = [];
  activeSuggestionIndex: number = -1;
  showSuggestions: boolean = true; // Bandera para controlar la visibilidad de las sugerencias
  private inputSubscription: Subscription;

  constructor(private elementRef: ElementRef) {}

  //ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.inputSubscription = fromEvent(this.searchInput.nativeElement, 'input').pipe(
      debounceTime(500),
      map((event: Event) => (event.target as HTMLInputElement).value)
    ).subscribe(value => {
      this.searchTerm = value;
      this.showSuggestions = true;
      this.searchPerformed.emit(this.searchTerm);
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
    }
  }

  onEnterPressed(): void {
    if (this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < this.suggestions.length) {
      this.selectSuggestion(this.suggestions[this.activeSuggestionIndex]);
    } else {
      this.searchPerformed.emit(this.searchTerm);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.suggestions.length;
    } else if (event.key === 'ArrowUp') {
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + this.suggestions.length) % this.suggestions.length;
    } else if (event.key === 'Enter') {
      this.onEnterPressed();
    }
  }

  ngOnDestroy(): void {
    if (this.inputSubscription) {
      this.inputSubscription.unsubscribe();
    }
  }

  updateSuggestions(suggestions: string[]): void {
    this.suggestions = suggestions;
    this.activeSuggestionIndex = -1; // Reset the active suggestion index
  }


  selectSuggestion(suggestion: string): void {
    this.searchTerm = suggestion;
    this.searchPerformed.emit(this.searchTerm);
    this.suggestions = []; // Limpiar las sugerencias después de seleccionar una
    this.showSuggestions = false; // Ocultar sugerencias hasta que se modifique el input
  }

}
