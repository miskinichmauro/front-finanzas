import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models';

export interface AuthUser {
  userId:   string;
  userName: string;
  email:    string;
  role:     UserRole;
}

const STORAGE_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<AuthUser | null>(this.loadFromStorage());

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly isAdmin     = computed(() => this._user()?.role === UserRole.Admin);

  login(email: string, password: string) {
    return this.http
      .post<AuthUser>(`${environment.apiUrl}/api/auth/login`, { email, password }, { withCredentials: true })
      .pipe(tap(user => this.setUser(user)));
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<AuthUser>(`${environment.apiUrl}/api/auth/register`, { name, email, password }, { withCredentials: true })
      .pipe(tap(user => this.setUser(user)));
  }

  logout(expired = false): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/login'], expired ? { state: { expired: true } } : undefined);
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}, { withCredentials: true }).subscribe();
  }

  private setUser(user: AuthUser): void {
    this._user.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
