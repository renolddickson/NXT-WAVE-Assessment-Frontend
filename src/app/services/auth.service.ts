import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, delay } from 'rxjs/operators';
import { User, AuthResponse } from '../models/types';
import { MOCK_USERS } from '../models/mock-db';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  
  public useMock = false;

  // Signal for the current logged-in user
  readonly currentUser = signal<User | null>(this.loadUserFromStorage());

  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  readonly isManager = computed(() => this.currentUser()?.role === 'MANAGER');
  readonly isMember = computed(() => this.currentUser()?.role === 'MEMBER');

  constructor(private http: HttpClient) {}

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    if (!userJson || userJson === 'undefined' || userJson === 'null') {
      localStorage.removeItem('user');
      return null;
    }

    try {
      return JSON.parse(userJson) as User;
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  login(email: string, password: string): Observable<AuthResponse> {
    if (this.useMock) {
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) {
        return throwError(() => ({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid email or password.'
        }));
      }

      const response: AuthResponse = {
        accessToken: `mock-access-token-${user.id}`,
        refreshToken: `mock-refresh-token-${user.id}`,
        user
      };

      return of(response).pipe(
        delay(600), // Simulate network delay
        tap(res => this.saveSession(res))
      );
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(name: string, email: string, password: string, organizationName: string): Observable<AuthResponse> {
    if (this.useMock) {
      // Mock register creates an ADMIN user as requested
      const newUser: User = {
        id: `u-${Date.now()}`,
        name,
        email,
        role: 'ADMIN',
        organizationId: 'org-123',
        organizationName
      };

      MOCK_USERS.push(newUser);

      const response: AuthResponse = {
        accessToken: `mock-access-token-${newUser.id}`,
        refreshToken: `mock-refresh-token-${newUser.id}`,
        user: newUser
      };

      return of(response).pipe(
        delay(600),
        tap(res => this.saveSession(res))
      );
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/register`, { name, email, password, organizationName }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const rToken = this.getRefreshToken();
    if (!rToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.useMock) {
      const current = this.currentUser();
      if (!current) return throwError(() => new Error('No active session'));
      const response: AuthResponse = {
        accessToken: `mock-access-token-refreshed-${current.id}`,
        refreshToken: rToken,
        user: current
      };
      return of(response).pipe(
        delay(300),
        tap(res => this.saveSession(res))
      );
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken: rToken }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  logout(): Observable<void> {
    if (this.useMock) {
      this.clearSession();
      return of(void 0);
    }

    const refreshToken = this.getRefreshToken() || '';
    return this.http.post<void>(`${this.API_URL}/logout`, { refreshToken }).pipe(
      tap({
        next: () => this.clearSession(),
        error: () => this.clearSession() // Clean up local storage even if API logout fails
      })
    );
  }

  private saveSession(response: AuthResponse): void {
    if (!response?.accessToken || !response?.refreshToken || !response?.user) {
      throw new Error('Invalid auth response from server.');
    }

    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }
}
