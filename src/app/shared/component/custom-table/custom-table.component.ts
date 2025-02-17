import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'ngx-custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss']
})
export class CustomTableComponent implements OnInit, OnChanges{
  @Input() structTable: any[] = [];
  @Input() content: any[] = [];
  @Input() padre: string;
  @Output() checkboxChange = new EventEmitter<{ id: number; checked: boolean }>();
  @Output() editClick = new EventEmitter<number>();


  dataSource: MatTableDataSource<any>;

  displayedColumns: string[];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor() { }

  ngOnInit(): void {
    if (this.padre === 'users-management') {
      this.displayedColumns = [...this.structTable.map(col => col.column)];
    } else {
      this.displayedColumns = [...this.structTable.map(col => col.column), 'actions']; // TITULOS CON MAYUSCULA
    }


    this.dataSource = new MatTableDataSource(this.content);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  isAdminUser(row: any): boolean {
    return row.roles && row.roles.some(role => role.name === 'SUPADMIN');
  }

  onCheckboxChange(id: number, checked: boolean) {
    this.checkboxChange.emit({ id, checked });
  }

  onEditClick(id: number): void {
    this.editClick.emit(id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.content && this.dataSource) {
      this.dataSource.data = this.content;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

}
