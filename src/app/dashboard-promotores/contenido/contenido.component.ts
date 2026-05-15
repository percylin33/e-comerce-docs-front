import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ContentService } from '../../@core/backend/services/content.service';
import { DashboardService } from '../../@core/backend/services/dashboard.service';
import { FormsModule } from '@angular/forms';
import { AdminHeaderActionsComponent } from '../../@theme/components/admin-header-actions/admin-header-actions.component';
import { NgClass, UpperCasePipe, SlicePipe } from '@angular/common';

interface VideoItem {
  id: string;
  title: string;
  url: string;
  category: string;
  duration?: string;
}

interface ResourceItem {
  id: string;
  title: string;
  url: string;
  type: string;
  size?: string;
}

@Component({
    selector: 'ngx-contenido',
    templateUrl: './contenido.component.html',
    styleUrls: ['./contenido.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FormsModule,
        AdminHeaderActionsComponent,
        NgClass,
        UpperCasePipe,
        SlicePipe,
    ],
})
export class ContenidoComponent implements OnInit {
  private contentService = inject(ContentService);
  private dashboardService = inject(DashboardService);

  // modal visibility
  showVideoModal = false;
  showResourceModal = false;

  // form model for video/resource (template-driven)
  currentVideo: VideoItem = { id: '', title: '', url: '', category: 'inicio', duration: '' };
  currentResource: ResourceItem = { id: '', title: '', url: '', type: 'pdf', size: '' };

  // content lists (in-memory for now)
  videos: VideoItem[] = [];
  resources: ResourceItem[] = [];

  loading = false;
  // Próximo lanzamiento (anuncio) - linked to backend
  anuncioText = 'Estamos trabajando en nuevos tutoriales y recursos para ayudarte a tener aún más éxito.';
  editingAnuncio = false;
  isSavingAnuncio = false;

  ngOnInit(): void {
    this.loadVideos();
    this.loadResources();
    this.loadAnuncio();
  }

  loadAnuncio(): void {
    this.dashboardService.getNextLaunch().subscribe({
      next: dto => {
        this.anuncioText = dto?.content && dto.content.length > 0 ? dto.content : this.anuncioText;
      },
      error: err => {
        console.warn('Error loading anuncio (next-launch) from backend', err);
      }
    });
  }

  saveAnuncio(): void {
    if (this.isSavingAnuncio) return;
    this.isSavingAnuncio = true;
    this.dashboardService.saveNextLaunch(this.anuncioText || '').subscribe({
      next: dto => {
        this.anuncioText = dto?.content || this.anuncioText;
        this.isSavingAnuncio = false;
        this.editingAnuncio = false;
      },
      error: err => {
        console.error('Error saving anuncio', err);
        this.isSavingAnuncio = false;
      }
    });
  }

  private loadVideos(page = 0, size = 100): void {
    this.loading = true;
    this.contentService.getVideos(page, size).subscribe({
      next: resp => {
        const items: any[] = resp.content || [];
        this.videos = items.map(v => ({
          id: String(v.id),
          title: v.title,
          url: v.youtubeId && !v.youtubeId.startsWith('http') ? `https://www.youtube.com/watch?v=${v.youtubeId}` : (v.youtubeId || ''),
          category: v.category || '',
          duration: ''
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private loadResources(page = 0, size = 100): void {
    this.loading = true;
    this.contentService.getResources(page, size).subscribe({
      next: resp => {
        const items: any[] = resp.content || [];
        this.resources = items.map(r => ({
          id: String(r.id),
          title: r.title,
          url: r.driveUrl || r.url || '',
          type: r.type || '',
          size: ''
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Modal handlers
  openAddVideo(): void {
    this.currentVideo = { id: '', title: '', url: '', category: 'inicio', duration: '' };
    this.showVideoModal = true;
  }

  openEditVideo(video: VideoItem): void {
    this.currentVideo = { ...video };
    this.showVideoModal = true;
  }

  closeVideoModal(): void {
    this.showVideoModal = false;
  }

  saveVideo(): void {
    if (!this.currentVideo.title || !this.currentVideo.url) return;

    const payload: any = {
      title: this.currentVideo.title,
      youtubeId: this.extractYoutubeId(this.currentVideo.url),
      category: this.currentVideo.category,
      description: '',
      thumbnailUrl: '',
      published: true
    };

    if (this.currentVideo.id) {
      const idNum = Number(this.currentVideo.id);
      this.contentService.updateVideo(idNum, payload).subscribe({ next: () => { this.loadVideos(); this.closeVideoModal(); } });
    } else {
      this.contentService.createVideo(payload).subscribe({ next: () => { this.loadVideos(); this.closeVideoModal(); } });
    }
  }

  deleteVideo(id: string): void {
    const idNum = Number(id);
    this.contentService.deleteVideo(idNum).subscribe({ next: () => this.loadVideos() });
  }

  // Resources
  openAddResource(): void {
    this.currentResource = { id: '', title: '', url: '', type: 'pdf', size: '' };
    this.showResourceModal = true;
  }

  openEditResource(res: ResourceItem): void {
    this.currentResource = { ...res };
    this.showResourceModal = true;
  }

  closeResourceModal(): void {
    this.showResourceModal = false;
  }

  saveResource(): void {
    if (!this.currentResource.title || !this.currentResource.url) return;

    const payload: any = {
      title: this.currentResource.title,
      driveUrl: this.currentResource.url,
      type: this.currentResource.type,
      tags: '',
      published: true
    };

    if (this.currentResource.id) {
      const idNum = Number(this.currentResource.id);
      this.contentService.updateResource(idNum, payload).subscribe({ next: () => { this.loadResources(); this.closeResourceModal(); } });
    } else {
      this.contentService.createResource(payload).subscribe({ next: () => { this.loadResources(); this.closeResourceModal(); } });
    }
  }

  deleteResource(id: string): void {
    const idNum = Number(id);
    this.contentService.deleteResource(idNum).subscribe({ next: () => this.loadResources() });
  }

  private extractYoutubeId(url: string): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.searchParams.has('v')) return u.searchParams.get('v') || '';
      // last path segment (e.g. youtu.be/<id>)
      const parts = u.pathname.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1] : url;
    } catch (e) {
      // fallback: try regex
      const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
      return m ? m[1] : url;
    }
  }
}
