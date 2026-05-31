import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, UserAnalytics } from '../../services/analytics.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  mathMin = Math.min;

  // Core reactive state signals
  analyticsData = signal<UserAnalytics[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Derived dashboard signals
  totalOverdue = signal<number>(0);
  teamAvgCompletionTime = signal<number | null>(null);
  totalMembers = signal<number>(0);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.analyticsService.getTaskAnalytics().subscribe({
      next: (response) => {
        const data = response.analytics || [];
        this.analyticsData.set(data);
        this.calculateAggregates(data);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse | { message?: string }) => {
        this.errorMessage.set(error.message || 'Failed to fetch team analytics data. Please ensure the backend server is running.');
        this.isLoading.set(false);
      }
    });
  }

  private calculateAggregates(data: UserAnalytics[]): void {
    this.totalMembers.set(data.length);

    // Sum of all overdue tasks
    const overdueSum = data.reduce((sum, item) => sum + (item.overdueTaskCount || 0), 0);
    this.totalOverdue.set(overdueSum);

    // Average of valid completion speeds
    const validSpeeds = data
      .map(item => item.avgCompletionTimeHours)
      .filter((speed): speed is number => speed !== null && speed !== undefined);

    if (validSpeeds.length > 0) {
      const avg = validSpeeds.reduce((sum, val) => sum + val, 0) / validSpeeds.length;
      this.teamAvgCompletionTime.set(Math.round(avg * 10) / 10); // Round to 1 decimal place
    } else {
      this.teamAvgCompletionTime.set(null);
    }
  }

  getRoleBadgeClass(role: string): { [key: string]: boolean } {
    return {
      'bg-blue-50 text-blue-700 border-blue-200': role === 'ADMIN',
      'bg-purple-50 text-purple-700 border-purple-200': role === 'MANAGER',
      'bg-slate-50 text-slate-700 border-slate-200': role === 'MEMBER'
    };
  }
}
