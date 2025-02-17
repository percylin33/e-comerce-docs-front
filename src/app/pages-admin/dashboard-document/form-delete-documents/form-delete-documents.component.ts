import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DocumentData } from '../../../@core/interfaces/documents';

@Component({
  selector: 'ngx-form-delete-documents',
  templateUrl: './form-delete-documents.component.html',
  styleUrls: ['./form-delete-documents.component.scss']
})
export class FormDeleteDocumentsComponent implements OnInit {
  selectedIds: number[] = [];

  constructor(protected ref: MatDialogRef<FormDeleteDocumentsComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogData: { selectedIds: number[] },
              private documents: DocumentData,
  ) { }

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
