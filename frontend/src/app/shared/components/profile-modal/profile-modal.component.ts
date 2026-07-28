import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile-modal.component.html',
  styleUrl: './profile-modal.component.scss'
})
export class ProfileModalComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  user: User | null = null;

  // Form fields
  username = '';
  first_name = '';
  last_name = '';
  email = '';
  phone = '';

  // Avatar file handling
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // UI state
  loading = true;
  saving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.populateForm(user);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        // Fallback to local stored user if GET fails
        this.user = this.authService.getUser();
        if (this.user) {
          this.populateForm(this.user);
        }
        this.loading = false;
      }
    });
  }

  populateForm(user: User): void {
    this.username = user.username || '';
    this.first_name = user.first_name || '';
    this.last_name = user.last_name || '';
    this.email = user.email || '';
    this.phone = user.phone || '';
    this.previewUrl = this.authService.getAvatarUrl(user.avatar);
  }

  get initials(): string {
    if (!this.username) return 'U';
    return this.username.charAt(0).toUpperCase();
  }

  get formattedRole(): string {
    if (!this.user?.role) return 'Usuario';
    const roles: Record<string, string> = {
      CIUDADANO: 'Ciudadano',
      RECICLADOR: 'Reciclador',
      CENTRO_ACOPIO: 'Centro de Acopio'
    };
    return roles[this.user.role] || this.user.role;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate image type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, WEBP).';
        return;
      }

      // Max size limit (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe superar los 5MB.';
        return;
      }

      this.errorMessage = null;
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  validate(): boolean {
    this.errorMessage = null;

    if (!this.username || !this.username.trim()) {
      this.errorMessage = 'El nombre de usuario es obligatorio.';
      return false;
    }

    if (this.username.trim().length < 3) {
      this.errorMessage = 'El nombre de usuario debe tener al menos 3 caracteres.';
      return false;
    }

    if (this.email && !this.isValidEmail(this.email)) {
      this.errorMessage = 'Ingresa un correo electrónico válido.';
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  saveProfile(): void {
    if (!this.validate()) return;

    this.saving = true;
    this.successMessage = null;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('username', this.username.trim());
    formData.append('first_name', this.first_name.trim());
    formData.append('last_name', this.last_name.trim());
    formData.append('email', this.email.trim());
    formData.append('phone', this.phone.trim());

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    this.authService.updateProfile(formData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.saving = false;
        this.successMessage = '¡Perfil actualizado con éxito!';
        this.selectedFile = null;
        if (updatedUser.avatar) {
          this.previewUrl = this.authService.getAvatarUrl(updatedUser.avatar);
        }
      },
      error: (err) => {
        console.error('Error guardando perfil:', err);
        this.saving = false;

        if (err.error && typeof err.error === 'object') {
          const messages: string[] = [];
          for (const key of Object.keys(err.error)) {
            const fieldError = err.error[key];
            if (Array.isArray(fieldError)) {
              messages.push(`${key}: ${fieldError.join(' ')}`);
            } else if (typeof fieldError === 'string') {
              messages.push(fieldError);
            }
          }
          this.errorMessage = messages.length > 0 ? messages.join(' | ') : 'Error al guardar los datos.';
        } else {
          this.errorMessage = 'Ocurrió un error al actualizar el perfil. Intenta nuevamente.';
        }
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
