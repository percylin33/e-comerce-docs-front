import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DocumentData } from '../../../@core/interfaces/documents';

@Component({
  selector: 'ngx-form-delete-fisico',
  templateUrl: './form-delete-fisico.component.html',
  styleUrls: ['./form-delete-fisico.component.scss']
})
export class FormDeleteFisicoComponent implements OnInit {
  selectedIds: number[] = [];
  isChecked: boolean = false;
  
    constructor(protected ref: MatDialogRef<FormDeleteFisicoComponent>,
                @Inject(MAT_DIALOG_DATA) public dialogData: { selectedIds: number[] },
                private documents: DocumentData,
    ) { }

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
