import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { DocumentData } from '../../../@core/interfaces/documents';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'ngx-form-delete-fisico',
    templateUrl: './form-delete-fisico.component.html',
    styleUrls: ['./form-delete-fisico.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatCheckbox, FormsModule, MatDialogActions, MatButton]
})
export class FormDeleteFisicoComponent implements OnInit {
  protected ref = inject<MatDialogRef<FormDeleteFisicoComponent>>(MatDialogRef);
  dialogData = inject(MAT_DIALOG_DATA);
  private documents = inject(DocumentData);

  selectedIds: number[] = [];
  isChecked: boolean = false;

    ngOnInit(): void {
      this.selectedIds = this.dialogData.selectedIds;
    }
  
    confirmDelete() {
      for (let id of this.selectedIds) {
        this.documents.deleteDocumentFisico(id).subscribe((response) => {
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
