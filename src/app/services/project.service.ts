import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Project } from '../models/types';
import { MOCK_PROJECTS } from '../models/mock-db';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly API_URL = 'http://localhost:3000/api/projects';
  
  public useMock = false;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    if (this.useMock) {
      return of([...MOCK_PROJECTS]).pipe(delay(400));
    }
    return this.http.get<Project[]>(this.API_URL);
  }

  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    if (this.useMock) {
      if (!project.name.trim()) {
        return throwError(() => ({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Project name is required.'
        }));
      }
      
      const newProject: Project = {
        ...project,
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      MOCK_PROJECTS.push(newProject);
      return of(newProject).pipe(delay(400));
    }
    return this.http.post<Project>(this.API_URL, project);
  }

  updateProject(id: string, updates: Partial<Project>): Observable<Project> {
    if (this.useMock) {
      const idx = MOCK_PROJECTS.findIndex(p => p.id === id);
      if (idx === -1) {
        return throwError(() => ({
          status: 404,
          message: 'Project not found.'
        }));
      }
      MOCK_PROJECTS[idx] = { ...MOCK_PROJECTS[idx], ...updates };
      return of(MOCK_PROJECTS[idx]).pipe(delay(400));
    }
    return this.http.put<Project>(`${this.API_URL}/${id}`, updates);
  }

  deleteProject(id: string): Observable<void> {
    if (this.useMock) {
      const idx = MOCK_PROJECTS.findIndex(p => p.id === id);
      if (idx === -1) {
        return throwError(() => ({
          status: 404,
          message: 'Project not found.'
        }));
      }
      MOCK_PROJECTS.splice(idx, 1);
      return of(void 0).pipe(delay(400));
    }
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
