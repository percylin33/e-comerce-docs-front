import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContentApi {
  private api = inject(HttpService);


  // Videos
  getVideos(page: number, size: number): Observable<any> {
    return this.api.get(`api/v1/promotores/content/videos?page=${page}&size=${size}`);
  }

  createVideo(data: any): Observable<any> {
    return this.api.post('api/v1/promotores/content/videos', data);
  }

  updateVideo(id: number, data: any): Observable<any> {
    return this.api.put(`api/v1/promotores/content/videos/${id}`, data);
  }

  deleteVideo(id: number): Observable<any> {
    return this.api.delete(`api/v1/promotores/content/videos/${id}`);
  }

  // Resources
  getResources(page?: number, size?: number): Observable<any> {
    if (page !== undefined && size !== undefined) {
      return this.api.get(`api/v1/promotores/content/resources?page=${page}&size=${size}`);
    }
    return this.api.get('api/v1/promotores/content/resources?page=0&size=100');
  }

  getResourcesByType(type: string): Observable<any> {
    return this.api.get(`api/v1/promotores/content/resources?type=${type}`);
  }

  createResource(data: any): Observable<any> {
    return this.api.post('api/v1/promotores/content/resources', data);
  }

  updateResource(id: number, data: any): Observable<any> {
    return this.api.put(`api/v1/promotores/content/resources/${id}`, data);
  }

  deleteResource(id: number): Observable<any> {
    return this.api.delete(`api/v1/promotores/content/resources/${id}`);
  }

  // Release Notes
  getLatestReleaseNote(): Observable<any> {
    return this.api.get('api/v1/promotores/content/release-note');
  }

}
