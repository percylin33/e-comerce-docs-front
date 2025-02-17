import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-document-description-modal',
  templateUrl: './document-description-modal.component.html',
  styleUrls: ['./document-description-modal.component.scss']
})
export class DocumentDescriptionModalComponent {
  @Input() description: string;

  constructor(protected ref: NbDialogRef<DocumentDescriptionModalComponent>) {}

  close() {
    this.ref.close();
  }
}
