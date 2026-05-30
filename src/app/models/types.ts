export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  organizationId?: string;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  assignee: string; // User ID string
  projectId: string; // Project ID string
  assigneeUser?: User; // Populated assignee
  Project?: Project; // Populated project
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface APIError {
  status?: number;
  code?: string;
  message: string;
}
