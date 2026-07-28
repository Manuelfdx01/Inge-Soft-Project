import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PostComment {
  id: number;
  username: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

export interface CommunityPost {
  id: number;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  content: string;
  tags: string[];
  created_at: string;
  comments: PostComment[];
  comment_count: number;
}

export const COMMUNITY_TAGS = [
  'Todos', 'Trabajo', 'Dudas', 'Residuos', 'Trueque', 'Negocio', 'Noticias', 'General'
];

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly base = `${environment.apiUrl}/community`;

  constructor(private http: HttpClient) {}

  /** Obtener publicaciones, con filtro opcional por etiqueta */
  getPosts(tag?: string): Observable<CommunityPost[]> {
    let params = new HttpParams();
    if (tag && tag !== 'Todos') {
      params = params.set('tag', tag);
    }
    return this.http.get<CommunityPost[]>(`${this.base}/`, { params });
  }

  /** Crear nueva publicación */
  createPost(content: string, tags: string[]): Observable<CommunityPost> {
    return this.http.post<CommunityPost>(`${this.base}/`, { content, tags });
  }

  /** Eliminar una publicación propia */
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }

  /** Comentar en una publicación */
  addComment(postId: number, content: string): Observable<PostComment> {
    return this.http.post<PostComment>(`${this.base}/${postId}/comentar/`, { content });
  }
}
