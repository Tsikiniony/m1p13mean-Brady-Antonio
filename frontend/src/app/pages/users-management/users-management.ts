import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.html',
  styleUrl: './users-management.css'
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  isEditMode = false;
  currentUser: User = this.getEmptyUser();
  loading = false;
  savingUser = false;
  deletingUserId: string | null = null;
  error = '';
  private platformId = inject(PLATFORM_ID);

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.loadUsers());
    }
  }

  getEmptyUser(): User {
    return {
      name: '',
      email: '',
      password: '',
      role: 'client',
      isActive: true
    };
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get adminCount(): number {
    return this.users.filter(u => u.role === 'admin').length;
  }

  get activeCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentUser = this.getEmptyUser();
    this.error = '';
    this.showModal = true;
  }

  openEditModal(user: User) {
    this.isEditMode = true;
    this.currentUser = { ...user, password: '' };
    this.error = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentUser = this.getEmptyUser();
    this.error = '';
  }

  saveUser() {
    if (!this.currentUser.name || !this.currentUser.email) {
      this.error = 'Nom et email sont requis';
      return;
    }

    if (!this.isEditMode && !this.currentUser.password) {
      this.error = 'Le mot de passe est requis';
      return;
    }

    this.savingUser = true;
    this.error = '';

    if (this.isEditMode && this.currentUser._id) {
      // Mode édition
      const updateData: Partial<User> = {
        name: this.currentUser.name,
        email: this.currentUser.email,
        role: this.currentUser.role,
        isActive: this.currentUser.isActive
      };
      
      // Ajouter le password seulement s'il est fourni
      if (this.currentUser.password) {
        updateData.password = this.currentUser.password;
      }

      this.userService.updateUser(this.currentUser._id, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.savingUser = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la mise à jour';
          this.savingUser = false;
        }
      });
    } else {
      // Mode création
      this.userService.createUser(this.currentUser).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.savingUser = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la création';
          this.savingUser = false;
        }
      });
    }
  }

  deleteUser(id: string | undefined) {
    if (!id) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.deletingUserId = id;
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
          this.deletingUserId = null;
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la suppression';
          console.error(err);
          this.deletingUserId = null;
        }
      });
    }
  }

  isDeleting(id: string | undefined): boolean {
    return id === this.deletingUserId;
  }

  getStatusLabel(isActive: boolean | undefined): string {
    return isActive ? 'active' : 'inactive';
  }
}
