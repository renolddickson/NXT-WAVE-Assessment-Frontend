import { User, Project, Task } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Admin', email: 'admin@tracker.com', role: 'ADMIN', organizationName: 'TechCorp' },
  { id: 'u2', name: 'Bob Manager', email: 'manager@tracker.com', role: 'MANAGER', organizationName: 'TechCorp' },
  { id: 'u3', name: 'Charlie Member', email: 'member@tracker.com', role: 'MEMBER', organizationName: 'TechCorp' },
  { id: 'u4', name: 'David Developer', email: 'david@tracker.com', role: 'MEMBER', organizationName: 'TechCorp' }
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Task Tracker Frontend', description: 'Build the Angular frontend client.' },
  { id: 'p2', name: 'API Gateway Integration', description: 'Create backend controllers and middleware.' },
  { id: 'p3', name: 'DevOps & CI/CD', description: 'Deploy the system to cloud staging environments.' }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Implement Kanban Board Layout',
    description: 'Create Kanban columns and style them with Tailwind CSS grid/flex properties.',
    status: 'TODO',
    priority: 'HIGH',
    due_date: '2026-06-15',
    assignee: 'u3',
    projectId: 'p1',
    assigneeUser: MOCK_USERS[2],
    Project: MOCK_PROJECTS[0]
  },
  {
    id: 't2',
    title: 'Configure HTTP Request Interceptor',
    description: 'Attach access token and handle token automatic refresh on 401 response.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    due_date: '2026-06-20',
    assignee: 'u4',
    projectId: 'p1',
    assigneeUser: MOCK_USERS[3],
    Project: MOCK_PROJECTS[0]
  },
  {
    id: 't3',
    title: 'Set up Database Migrations',
    description: 'Define relational database tables for Users, Projects, and Tasks with proper constraints.',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    due_date: '2026-06-10',
    assignee: 'u2',
    projectId: 'p2',
    assigneeUser: MOCK_USERS[1],
    Project: MOCK_PROJECTS[1]
  },
  {
    id: 't4',
    title: 'Write API Controller Tests',
    description: 'Verify endpoint authorizations and parameter validators are fully protected.',
    status: 'BLOCKED',
    priority: 'LOW',
    due_date: '2026-06-25',
    assignee: 'u3',
    projectId: 'p2',
    assigneeUser: MOCK_USERS[2],
    Project: MOCK_PROJECTS[1]
  },
  {
    id: 't5',
    title: 'Configure SSL Certificates',
    description: 'Acquire production HTTPS certificates and enable automatic HSTS policies.',
    status: 'DONE',
    priority: 'HIGH',
    due_date: '2026-05-28',
    assignee: 'u1',
    projectId: 'p3',
    assigneeUser: MOCK_USERS[0],
    Project: MOCK_PROJECTS[2]
  }
];
