import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/types';
import { MOCK_USERS } from '../models/mock-db';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:3000/api/users';
  
  public useMock = false;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    if (this.useMock) {
      return of([...MOCK_USERS]).pipe(delay(400));
    }
    return this.http.get<User[]>(this.API_URL);
  }

  createUser(user: Omit<User, 'id'> & { password?: string }): Observable<User> {
    if (this.useMock) {
      const emailExists = MOCK_USERS.some(u => u.email === user.email);
      if (emailExists) {
        return throwError(() => ({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'User with this email already exists.'
        }));
      }

      const newUser: User = {
        ...user,
        id: `u-${Date.now()}`
      };
      MOCK_USERS.push(newUser);
      return of(newUser).pipe(delay(400));
    }
    return this.http.post<User>(this.API_URL, user);
  }

  updateUser(id: string, updates: Partial<User> & { password?: string }): Observable<User> {
    if (this.useMock) {
      const idx = MOCK_USERS.findIndex(u => u.id === id);
      if (idx === -1) {
        return throwError(() => ({
          status: 404,
          message: 'User not found.'
        }));
      }
      
      const emailExists = MOCK_USERS.some(u => u.email === updates.email && u.id !== id);
      if (emailExists) {
        return throwError(() => ({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'User with this email already exists.'
        }));
      }

      MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...updates };
      return of(MOCK_USERS[idx]).pipe(delay(400));
    }
    return this.http.put<User>(`${this.API_URL}/${id}`, updates);
  }

  deleteUser(id: string): Observable<void> {
    if (this.useMock) {
      const idx = MOCK_USERS.findIndex(u => u.id === id);
      if (idx === -1) {
        return throwError(() => ({
          status: 404,
          message: 'User not found.'
        }));
      }
      MOCK_USERS.splice(idx, 1);
      return of(void 0).pipe(delay(400));
    }
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
