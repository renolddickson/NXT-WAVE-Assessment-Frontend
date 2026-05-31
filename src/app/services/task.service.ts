import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Task, TaskStatus, TaskPriority } from '../models/types';
import { MOCK_TASKS, MOCK_USERS, MOCK_PROJECTS } from '../models/mock-db';
import { environment } from '../../environments/environment';

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = `${environment.apiUrl}/tasks`;
  
  public useMock = false;

  constructor(private http: HttpClient) {}

  getTasks(
    page: number = 1,
    limit: number = 10,
    status?: TaskStatus | '',
    priority?: TaskPriority | '',
    assignee?: string | ''
  ): Observable<TasksResponse> {
    if (this.useMock) {
      let filtered = [...MOCK_TASKS];

      // Filter by status
      if (status) {
        filtered = filtered.filter(t => t.status === status);
      }
      
      // Filter by priority
      if (priority) {
        filtered = filtered.filter(t => t.priority === priority);
      }
      
      // Filter by assignee
      if (assignee) {
        filtered = filtered.filter(t => t.assignee === assignee);
      }

      const total = filtered.length;
      const pages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const tasks = filtered.slice(start, start + limit);

      const response: TasksResponse = {
        tasks,
        pagination: {
          total,
          page,
          limit,
          pages
        }
      };

      return of(response).pipe(delay(400));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (assignee) params = params.set('assignee', assignee);

    return this.http.get<TasksResponse>(this.API_URL, { params });
  }

  getTaskById(id: string): Observable<Task> {
    if (this.useMock) {
      const task = MOCK_TASKS.find(t => t.id === id);
      if (!task) return throwError(() => new Error('Task not found'));
      return of({ ...task }).pipe(delay(200));
    }
    return this.http.get<Task>(`${this.API_URL}/${id}`);
  }

  createTask(task: Omit<Task, 'id' | 'status' | 'assigneeUser' | 'Project'>): Observable<Task> {
    if (this.useMock) {
      const assigneeUser = MOCK_USERS.find(u => u.id === task.assignee);
      const project = MOCK_PROJECTS.find(p => p.id === task.projectId);

      if (!assigneeUser) {
        return throwError(() => ({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Assignee is required.'
        }));
      }

      const newTask: Task = {
        ...task,
        id: `t-${Date.now()}`,
        status: 'TODO',
        assigneeUser,
        Project: project
      };
      
      MOCK_TASKS.unshift(newTask); // Add to beginning
      return of(newTask).pipe(delay(400));
    }
    return this.http.post<Task>(this.API_URL, task);
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'assigneeUser' | 'Project'>>): Observable<Task> {
    if (this.useMock) {
      const idx = MOCK_TASKS.findIndex(t => t.id === id);
      if (idx === -1) {
        return throwError(() => new Error('Task not found'));
      }

      const assigneeUser = updates.assignee ? MOCK_USERS.find(u => u.id === updates.assignee) : MOCK_TASKS[idx].assigneeUser;
      const project = updates.projectId ? MOCK_PROJECTS.find(p => p.id === updates.projectId) : MOCK_TASKS[idx].Project;

      MOCK_TASKS[idx] = {
        ...MOCK_TASKS[idx],
        ...updates,
        assigneeUser,
        Project: project
      } as Task;

      return of(MOCK_TASKS[idx]).pipe(delay(400));
    }
    return this.http.put<Task>(`${this.API_URL}/${id}`, updates);
  }

  advanceTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    if (this.useMock) {
      const idx = MOCK_TASKS.findIndex(t => t.id === id);
      if (idx === -1) {
        return throwError(() => new Error('Task not found'));
      }
      
      MOCK_TASKS[idx] = {
        ...MOCK_TASKS[idx],
        status
      };
      
      return of(MOCK_TASKS[idx]).pipe(delay(300));
    }
    return this.http.patch<Task>(`${this.API_URL}/${id}/status`, { status });
  }

  deleteTask(id: string): Observable<void> {
    if (this.useMock) {
      const idx = MOCK_TASKS.findIndex(t => t.id === id);
      if (idx === -1) {
        return throwError(() => new Error('Task not found'));
      }
      MOCK_TASKS.splice(idx, 1);
      return of(void 0).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
