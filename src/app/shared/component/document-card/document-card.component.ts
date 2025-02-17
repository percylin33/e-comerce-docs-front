import { Component, Input } from '@angular/core';
import { Document } from '../../../@core/interfaces/documents';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-document-card',
  templateUrl: './document-card.component.html',
  styleUrls: ['./document-card.component.scss']
})
export class DocumentCardComponent {
  @Input() document: Document;

  constructor(private router: Router) { }

  goDetails() {
    this.router.navigate(['site/detail', this.document.id]);
  }
}
