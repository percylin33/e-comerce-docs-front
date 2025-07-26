import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

export interface Block {
  icon: string;
  title: string;
  content: string[];
}

@Component({
  selector: 'ngx-document-description-modal',
  templateUrl: './document-description-modal.component.html',
  styleUrls: ['./document-description-modal.component.scss']
})




export class DocumentDescriptionModalComponent implements OnInit {
  @Input() description: string;
   blocks: any = [];
   paragraphs: string[] = [];

  constructor(protected ref: NbDialogRef<DocumentDescriptionModalComponent>) {}

  ngOnInit() {
    if (this.description) {
      const lines = this.description.split(/\r?\n/).filter(l => l.trim().length > 0);
      const blockRegex = /^([\u{1F300}-\u{1FAFF}])\s*(.*)/u;
      let currentBlock: Block | null = null;

      lines.forEach(line => {
        const match = line.match(blockRegex);
        if (match) {
          if (currentBlock) this.blocks.push(currentBlock);
          currentBlock = {
            icon: match[1],
            title: match[2],
            content: []
          };
        } else if (currentBlock) {
          currentBlock.content.push(line.trim().replace(/^•\s*/, ''));
        }
      });
      if (currentBlock) this.blocks.push(currentBlock);

      // Si no hay bloques, prepara los párrafos
      if (this.blocks.length === 0) {
        this.paragraphs = lines;
      }
    }
  }

  close() {
    this.ref.close();
  }
}