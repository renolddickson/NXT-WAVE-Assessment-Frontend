import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, TasksResponse } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Task, TaskStatus, TaskPriority, User } from '../../models/types';
import { TaskModalComponent } from '../../components/task-modal/task-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskModalComponent],
  templateUrl: './dashboard.component.html',
  styles: [`
    .kanban-column {
      min-height: 450px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isAdmin = this.authService.isAdmin;
  isManager = this.authService.isManager;
  isMember = this.authService.isMember;

  // Task lists & Pagination signals
  tasks = signal<Task[]>([]);
  totalTasks = signal(0);
  currentPage = signal(1);
  pageSize = 10;
  totalPages = signal(1);

  // Filters signals
  statusFilter = signal<TaskStatus | ''>('');
  priorityFilter = signal<TaskPriority | ''>('');
  assigneeFilter = signal<string>('');

  // Dropdown lists
  usersList = signal<User[]>([]);

  // Loading & Error States
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Modal control signals
  isModalOpen = signal(false);
  selectedTask = signal<Task | null>(null);

  // Active view toggle: 'board' or 'table'
  activeView = signal<'board' | 'table'>('table');

  // Kanban status columns list
  readonly statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'];

  activeTasks = computed(() => this.tasks().filter(task => task.status !== 'DONE').length);
  blockedTasks = computed(() => this.tasks().filter(task => task.status === 'BLOCKED').length);
  highPriorityTasks = computed(() => this.tasks().filter(task => task.priority === 'HIGH').length);

  ngOnInit(): void {
    if (!this.isMember()) {
      this.loadUsers();
    }
    this.loadTasks();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.usersList.set(users),
      error: () => this.errorMessage.set('Failed to load user list for filters.')
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // For MEMBER users, the backend automatically restricts tasks to only their assigned tasks.
    // In mock mode, the service mimics this:
    let targetAssignee = this.assigneeFilter();
    if (this.isMember()) {
      // Members can only see their own assigned tasks
      targetAssignee = this.currentUser()?.id || '';
    }

    this.taskService.getTasks(
      this.currentPage(),
      this.pageSize,
      this.statusFilter(),
      this.priorityFilter(),
      targetAssignee
    ).subscribe({
      next: (res: TasksResponse) => {
        this.tasks.set(res.tasks);
        this.totalTasks.set(res.pagination.total);
        this.totalPages.set(res.pagination.pages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load tasks.');
        this.isLoading.set(false);
      }
    });
  }

  // Filter handlers
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadTasks();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.priorityFilter.set('');
    this.assigneeFilter.set('');
    this.currentPage.set(1);
    this.loadTasks();
  }

  // Pagination handlers
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadTasks();
    }
  }

  // Task Mutation Handlers (ADMIN & MANAGER only)
  openCreateModal(): void {
    if (this.isMember()) return;
    this.selectedTask.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(task: Task): void {
    if (this.isMember()) return;
    this.selectedTask.set(task);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedTask.set(null);
  }

  onTaskSaved(): void {
    this.closeModal();
    this.loadTasks();
  }

  deleteTask(id: string): void {
    if (this.isMember()) return;
    if (confirm('Are you sure you want to delete this task?')) {
      this.isLoading.set(true);
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Failed to delete task.');
          this.isLoading.set(false);
        }
      });
    }
  }

  // Task Status Advancement Logic
  getValidTransitions(currentStatus: TaskStatus): TaskStatus[] {
    switch (currentStatus) {
      case 'TODO':
        return ['IN_PROGRESS', 'BLOCKED'];
      case 'IN_PROGRESS':
        return ['IN_REVIEW', 'BLOCKED'];
      case 'IN_REVIEW':
        return ['DONE', 'BLOCKED'];
      case 'BLOCKED':
        return ['TODO', 'IN_PROGRESS', 'IN_REVIEW'];
      default:
        return [];
    }
  }

  canAdvance(task: Task): boolean {
    const user = this.currentUser();
    if (!user) return false;
    // Only assignee or MANAGER or ADMIN can see status advance actions
    return task.assignee === user.id || user.role === 'MANAGER' || user.role === 'ADMIN';
  }

  advanceStatus(task: Task, nextStatus: TaskStatus): void {
    if (!this.canAdvance(task)) return;
    this.isLoading.set(true);
    this.taskService.advanceTaskStatus(task.id, nextStatus).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to advance status.');
        this.isLoading.set(false);
      }
    });
  }

  // Helper method to group tasks by status for columns
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  // Priority color classes
  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  formatStatus(value: TaskStatus | TaskPriority): string {
    return value
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  setView(view: 'board' | 'table'): void {
    this.activeView.set(view);
  }
}
