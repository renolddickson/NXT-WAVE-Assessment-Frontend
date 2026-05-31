import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/types';
import { MOCK_USERS } from '../models/mock-db';
import { environment } from '../../environments/environment';

export interface UserAnalytics {
  user: User;
  overdueTaskCount: number;
  avgCompletionTimeHours: number | null;
}

export interface TaskAnalyticsResponse {
  analytics: UserAnalytics[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly API_URL = `${environment.apiUrl}/analytics/tasks`;
  
  public useMock = false;

  constructor(private http: HttpClient) {}

  getTaskAnalytics(): Observable<TaskAnalyticsResponse> {
    if (this.useMock) {
      // Simulate team statistics based on mock users
      const mockData: TaskAnalyticsResponse = {
        analytics: MOCK_USERS.map((user, index) => {
          // Provide distinct analytical figures per user role and index
          let overdue = 0;
          let avgHours: number | null = null;

          if (user.role === 'MEMBER') {
            overdue = [2, 0, 1, 3][index % 4];
            avgHours = [14.5, 8.2, 22.0, 18.1][index % 4];
          } else if (user.role === 'MANAGER') {
            overdue = [1, 0][index % 2];
            avgHours = [28.5, 12.0][index % 2];
          } else {
            overdue = 0;
            avgHours = 6.4;
          }

          return {
            user,
            overdueTaskCount: overdue,
            avgCompletionTimeHours: avgHours
          };
        })
      };
      return of(mockData).pipe(delay(500));
    }

    return this.http.get<TaskAnalyticsResponse>(this.API_URL);
  }
}
