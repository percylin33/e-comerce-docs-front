import { Injectable, inject } from '@angular/core';
import { ContentApi } from '../api/content.api';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private api = inject(ContentApi);


  getVideos(page: number, size: number): Observable<any> {
    return this.api.getVideos(page, size);
  }

  createVideo(data: any): Observable<any> {
    return this.api.createVideo(data);
  }

  updateVideo(id: number, data: any): Observable<any> {
    return this.api.updateVideo(id, data);
  }

  deleteVideo(id: number): Observable<any> {
    return this.api.deleteVideo(id);
  }

  getResources(page?: number, size?: number): Observable<any> {
    return this.api.getResources(page, size);
  }

  getResourcesByType(type: string): Observable<any> {
    return this.api.getResourcesByType(type);
  }

  createResource(data: any): Observable<any> {
    return this.api.createResource(data);
  }

  updateResource(id: number, data: any): Observable<any> {
    return this.api.updateResource(id, data);
  }

  deleteResource(id: number): Observable<any> {
    return this.api.deleteResource(id);
  }

  getLatestReleaseNote(): Observable<any> {
    return this.api.getLatestReleaseNote();
  }

}
