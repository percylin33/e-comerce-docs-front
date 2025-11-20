import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { ContentService } from '../../@core/backend/services/content.service';

@Component({
  selector: 'ngx-guias',
  templateUrl: './guias.component.html',
  styleUrls: ['./guias.component.scss']
})
export class GuiasComponent implements OnInit {
  // Usuario
  currentUser: any;
  userName = '';
  userInitials = '';

  // Recursos
  videos: any[] = [];
  resources: any[] = [];
  loading = true;
  activeFilter = 'todos';
  
  // Release Note
  releaseNote: any = null;
  releaseNoteLoading = false;

  constructor(
    private sharedService: SharedService,
    private contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getCurrentUser();
    if (this.currentUser) {
      this.userName = `${this.currentUser.name || ''} ${this.currentUser.lastname || ''}`.trim();
      this.userInitials = this.getInitials(this.userName);
    }
    this.loadResources();
    this.loadReleaseNote();
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  private loadResources(): void {
    this.loading = true;
    
    this.contentService.getResources().subscribe({
      next: (response) => {
        if (response && response.content) {
          // Los recursos descargables (PDF, PPTX, ZIP, etc.)
          this.resources = response.content;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar recursos:', err);
        this.loading = false;
      }
    });

    // Cargar videos por separado
    this.contentService.getVideos(0, 100).subscribe({
      next: (response) => {
        if (response && response.content) {
          this.videos = response.content;
        }
      },
      error: (err) => {
        console.error('Error al cargar videos:', err);
      }
    });
  }

  private loadReleaseNote(): void {
    this.releaseNoteLoading = true;
    
    this.contentService.getLatestReleaseNote().subscribe({
      next: (response) => {
        if (response) {
          this.releaseNote = response;
        }
        this.releaseNoteLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar release note:', err);
        this.releaseNoteLoading = false;
      }
    });
  }

  getFilteredVideos(): any[] {
    if (this.activeFilter === 'todos') {
      return this.videos;
    }
    return this.videos.filter(v => v.category && v.category.includes(this.activeFilter));
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  getResourceIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'pdf': return 'fa-file-pdf';
      case 'pptx':
      case 'ppt': return 'fa-file-powerpoint';
      case 'zip':
      case 'rar': return 'fa-file-archive';
      case 'docx':
      case 'doc': return 'fa-file-word';
      default: return 'fa-file';
    }
  }

  getResourceIconClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'pdf': return 'icon-pdf';
      case 'pptx':
      case 'ppt': return 'icon-ppt';
      case 'zip':
      case 'rar': return 'icon-zip';
      default: return 'icon-default';
    }
  }

  getYoutubeId(url: string): string {
    if (!url) return '';
    
    // Si ya es un ID directo, devolverlo
    if (url.length === 11 && !url.includes('/') && !url.includes(':')) {
      return url;
    }
    
    // Extraer ID de diferentes formatos de URL de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\?\/]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return '';
  }

}
