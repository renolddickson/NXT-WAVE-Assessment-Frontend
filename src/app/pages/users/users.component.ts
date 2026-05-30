import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/types';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  users = signal<User[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Form states for creating/editing users
  userForm!: FormGroup;
  showForm = signal(false);
  isEditing = signal(false);
  editingUserId = signal<string | null>(null);

  readonly rolesList: UserRole[] = ['ADMIN', 'MANAGER', 'MEMBER'];

  ngOnInit(): void {
    // Shield route at component layer as well
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    this.initForm();
    this.loadUsers();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['MEMBER' as UserRole, [Validators.required]],
      password: ['', [Validators.minLength(4)]] // Optional during edit, required during create
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load organization users.');
        this.isLoading.set(false);
      }
    });
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.resetForm();
    } else {
      // Re-enable password required for creation
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(4)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  resetForm(): void {
    this.userForm.reset({ role: 'MEMBER' });
    this.isEditing.set(false);
    this.editingUserId.set(null);
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValues = { ...this.userForm.value };

    // Remove password if empty (during edit)
    if (!formValues.password) {
      delete formValues.password;
    }

    if (this.isEditing() && this.editingUserId()) {
      this.userService.updateUser(this.editingUserId()!, formValues).subscribe({
        next: () => {
          this.loadUsers();
          this.resetForm();
          this.showForm.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Failed to update user.');
          this.isLoading.set(false);
        }
      });
    } else {
      this.userService.createUser(formValues).subscribe({
        next: () => {
          this.loadUsers();
          this.resetForm();
          this.showForm.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Failed to create user.');
          this.isLoading.set(false);
        }
      });
    }
  }

  startEdit(user: User): void {
    this.isEditing.set(true);
    this.editingUserId.set(user.id);
    this.showForm.set(true);

    // Password not required during edit
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.setValidators([Validators.minLength(4)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
  }

  deleteUser(id: string): void {
    const current = this.authService.currentUser();
    if (current && current.id === id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (confirm('Are you sure you want to delete this user? All assigned tasks will remain but assignee reference might be cleared.')) {
      this.isLoading.set(true);
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Failed to delete user.');
          this.isLoading.set(false);
        }
      });
    }
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'MANAGER':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'MEMBER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }
}
