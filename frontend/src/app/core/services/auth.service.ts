import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  current_xp: number;
  current_level_min_xp: number;
  next_level_xp: number;
  next_level_title: string;
  xp_to_next: number;
  progress_pct: number;
}

export interface User {
  id: string | number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'CIUDADANO' | 'RECICLADOR' | 'CENTRO_ACOPIO';
  phone?: string;
  avatar?: string | null;
  points: number;
  xp?: number;
  level_info?: LevelInfo;
  is_available?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const stored = localStorage.getItem('user');

    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/login/`,
      { username, password }
    ).pipe(
      tap((res: any) => {
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.currentUserSubject.next(res.user);
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me/`).pipe(
      tap((user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  updateProfile(data: FormData | Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/me/`, data).pipe(
      tap((updatedUser: User) => {
        const currentUser = this.currentUserSubject.value;
        const mergedUser = { ...currentUser, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(mergedUser));
        this.currentUserSubject.next(mergedUser);
      })
    );
  }

  getAvatarUrl(avatarPath?: string | null): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:') || avatarPath.startsWith('blob:')) {
      return avatarPath;
    }
    const baseUrl = this.apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  }

  logout(): void {
    const refresh = localStorage.getItem('refresh_token');

    this.http.post(
      `${this.apiUrl}/auth/logout/`,
      { refresh }
    ).subscribe({
      error: () => {}
    });

    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }
}
