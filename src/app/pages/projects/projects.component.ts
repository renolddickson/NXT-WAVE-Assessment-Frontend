import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Project } from '../../models/types';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './projects.component.html'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  isMember = this.authService.isMember;

  projects = signal<Project[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Form states for creating/editing
  projectForm!: FormGroup;
  isEditing = signal(false);
  editingProjectId = signal<string | null>(null);
  showForm = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.loadProjects();
  }

  private initForm(): void {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]]
    });
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load projects.');
        this.isLoading.set(false);
      }
    });
  }

  toggleForm(): void {
    if (this.isMember()) return;
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.projectForm.reset();
    this.isEditing.set(false);
    this.editingProjectId.set(null);
  }

  onSubmit(): void {
    if (this.isMember()) return;
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.projectForm.value;

    if (this.isEditing() && this.editingProjectId()) {
      // Edit mode
      this.projectService.updateProject(this.editingProjectId()!, formValue).subscribe({
        next: () => {
          this.loadProjects();
          this.resetForm();
          this.showForm.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Failed to update project.');
          this.isLoading.set(false);
        }
      });
    } else {
      // Create mode
      this.projectService.createProject(formValue).subscribe({
        next: () => {
          this.loadProjects();
          this.resetForm();
          this.showForm.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Failed to create project.');
          this.isLoading.set(false);
        }
      });
    }
  }

  startEdit(project: Project): void {
    if (this.isMember()) return;
    this.isEditing.set(true);
    this.editingProjectId.set(project.id);
    this.projectForm.patchValue({
      name: project.name,
      description: project.description
    });
    this.showForm.set(true);
  }

  deleteProject(id: string): void {
    if (this.isMember()) return;
    if (confirm('Are you sure you want to delete this project? This will delete associated tasks on the server.')) {
      this.isLoading.set(true);
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.loadProjects();
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Failed to delete project.');
          this.isLoading.set(false);
        }
      });
    }
  }
}
