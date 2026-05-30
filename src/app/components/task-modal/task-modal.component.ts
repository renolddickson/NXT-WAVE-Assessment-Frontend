import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Task, User, Project } from '../../models/types';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-modal.component.html'
})
export class TaskModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);

  @Input() task: Task | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  taskForm!: FormGroup;
  users = signal<User[]>([]);
  projects = signal<Project[]>([]);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
  }

  private initForm(): void {
    // Format date for the input field (yyyy-MM-dd)
    let formattedDate = '';
    if (this.task && this.task.due_date) {
      formattedDate = new Date(this.task.due_date).toISOString().split('T')[0];
    }

    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required, Validators.maxLength(200)]],
      description: [this.task?.description || '', [Validators.maxLength(2000)]],
      priority: [this.task?.priority || 'MEDIUM', [Validators.required]],
      assignee: [this.task?.assignee || '', [Validators.required]],
      projectId: [this.task?.projectId || '', []],
      due_date: [formattedDate, [Validators.required, this.futureDateValidator]]
    });
  }

  private futureDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? null : { notFuture: true };
  }

  private loadDropdownData(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.errorMessage.set('Failed to load users for assignee.')
    });

    this.projectService.getProjects().subscribe({
      next: (data) => this.projects.set(data),
      error: () => this.errorMessage.set('Failed to load projects.')
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValues = { ...this.taskForm.value };
    
    // API wants null if project empty
    if (!formValues.projectId) {
      formValues.projectId = null;
    }

    if (this.task) {
      // Update Mode
      this.taskService.updateTask(this.task.id, formValues).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Failed to update task.');
        }
      });
    } else {
      // Create Mode
      this.taskService.createTask(formValues).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Failed to create task.');
        }
      });
    }
  }
}
