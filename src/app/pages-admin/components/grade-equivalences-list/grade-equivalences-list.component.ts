import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GradeEquivalenceService } from '../../../@core/backend/services/kit-approval.service';
import { GradeEquivalenceDto } from '../../../@core/interfaces/kit-approval';

interface LevelStats {
  INICIAL: number;
  PRIMARIA: number;
  SECUNDARIA: number;
}

interface NivelOption {
  code: string;
  nombre: string;
}

@Component({
  selector: 'ngx-grade-equivalences-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
],
  templateUrl: './grade-equivalences-list.component.html',
  styleUrls: ['./grade-equivalences-list.component.scss']
})
export class GradeEquivalencesListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'levelCode', 'materia', 'opcion', 'grade', 'actions'];
  
  // Data
  allData: GradeEquivalenceDto[] = [];
  loading = true;
  error: string | null = null;
  
  // Stats
  stats: LevelStats = { INICIAL: 0, PRIMARIA: 0, SECUNDARIA: 0 };
  
  // Filters
  selectedLevel: string = '';
  searchTerm: string = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Niveles disponibles
  niveles: NivelOption[] = [
    { code: 'INICIAL', nombre: 'Inicial' },
    { code: 'PRIMARIA', nombre: 'Primaria' },
    { code: 'SECUNDARIA', nombre: 'Secundaria' }
  ];
  
  // Delete confirmation
  confirmDeleteId: number | null = null;

  constructor(
    private service: GradeEquivalenceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.service.getAll().subscribe({
      next: (response) => {
        if (response.result) {
          // Ajuste: usa cast a any para evitar error de TS
          const data: any = response.data;
          if (data && Array.isArray(data.equivalences)) {
            this.allData = data.equivalences;
          } else {
            this.allData = [];
          }
          this.calculateStats();
          this.totalItems = this.filteredEquivalences.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        } else {
          this.error = 'Error al cargar las equivalencias';
          this.allData = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading equivalences:', err);
        this.error = 'Error al conectar con el servidor';
        this.allData = [];
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats = { INICIAL: 0, PRIMARIA: 0, SECUNDARIA: 0 };
    this.allData.forEach(eq => {
      if (eq.levelCode === 'INICIAL') this.stats.INICIAL++;
      else if (eq.levelCode === 'PRIMARIA') this.stats.PRIMARIA++;
      else if (eq.levelCode === 'SECUNDARIA') this.stats.SECUNDARIA++;
    });
  }

  get filteredEquivalences(): GradeEquivalenceDto[] {
    let filtered = [...this.allData];
    
    // Filter by level
    if (this.selectedLevel) {
      filtered = filtered.filter(eq => eq.levelCode === this.selectedLevel);
    }
    
    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(eq => 
        (eq.materiaNombre?.toLowerCase().includes(term)) ||
        (eq.opcionNombre?.toLowerCase().includes(term)) ||
        (eq.gradeNombre?.toLowerCase().includes(term)) ||
        eq.levelCode.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  getPaginatedItems(): GradeEquivalenceDto[] {
    const filtered = this.filteredEquivalences;
    const start = this.currentPage * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  filterByLevel(level: string): void {
    this.selectedLevel = this.selectedLevel === level ? '' : level;
    this.currentPage = 0;
    this.totalItems = this.filteredEquivalences.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.totalItems = this.filteredEquivalences.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
    }
  }

  editEquivalence(id: number): void {
    this.router.navigate(['/pages-admin/grade-equivalences', id, 'edit']);
  }

  createEquivalence(): void {
    this.router.navigate(['/pages-admin/grade-equivalences', 'new']);
  }

  showConfirmDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  deleteEquivalence(id: number): void {
    this.service.delete(id).subscribe({
      next: (response) => {
        if (response.result) {
          this.confirmDeleteId = null;
          this.loadData();
        } else {
          this.error = 'Error al eliminar la equivalencia';
        }
      },
      error: (err) => {
        console.error('Error deleting equivalence:', err);
        this.error = 'Error al eliminar la equivalencia';
      }
    });
  }

  toggleActive(id: number, currentState: boolean): void {
    // TODO: Implement toggle active if needed
    console.log('Toggle active not implemented:', id, currentState);
  }

  bulkImport(): void {
    // TODO: Implement bulk import functionality
    alert('Funcionalidad de importación masiva en desarrollo');
  }

  trackById(index: number, item: GradeEquivalenceDto): number {
    return item.id;
  }

  getLevelBadgeClass(level: string): string {
    const classes: Record<string, string> = {
      'INICIAL': 'badge-inicial',
      'PRIMARIA': 'badge-primaria',
      'SECUNDARIA': 'badge-secundaria'
    };
    return classes[level] || 'badge-default';
  }
}
