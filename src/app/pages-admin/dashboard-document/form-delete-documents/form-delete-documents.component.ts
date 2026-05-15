import { Component, Input, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { DocumentData } from '../../../@core/interfaces/documents';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'ngx-form-delete-documents',
    templateUrl: './form-delete-documents.component.html',
    styleUrls: ['./form-delete-documents.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton]
})
export class FormDeleteDocumentsComponent implements OnInit {
  protected ref = inject<MatDialogRef<FormDeleteDocumentsComponent>>(MatDialogRef);
  dialogData = inject(MAT_DIALOG_DATA);
  private documents = inject(DocumentData);

  selectedIds: number[] = [];

  ngOnInit(): void {
    this.selectedIds = this.dialogData.selectedIds;
  }

  confirmDelete() {
    for (let id of this.selectedIds) {
      this.documents.delete(id).subscribe((response) => {
        if (response.status === 200) {
          this.ref.close();
        }
      });
    }

  }

  cancel() {
    this.ref.close();
  }
}
