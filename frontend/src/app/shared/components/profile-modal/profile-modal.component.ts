import { Component, EventEmitter, OnInit, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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

  readonly user = signal<User | null>(null);

  // Form fields
  username = '';
  first_name = '';
  last_name = '';
  email = '';
  phone = '';

  // Avatar file handling
  selectedFile: File | null = null;
  readonly previewUrl = signal<string | null>(null);

  // UI state
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly initials = computed(() => {
    const u = this.user();
    if (!u || !u.username) return 'U';
    return u.username.charAt(0).toUpperCase();
  });

  readonly formattedRole = computed(() => {
    const u = this.user();
    if (!u?.role) return 'Usuario';
    const roles: Record<string, string> = {
      CIUDADANO: 'Ciudadano',
      RECICLADOR: 'Reciclador',
      CENTRO_ACOPIO: 'Centro de Acopio'
    };
    return roles[u.role] || u.role;
  });

  constructor(
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.loading.set(true);
    this.authService.getProfile().subscribe({
      next: (u) => {
        this.user.set(u);
        this.populateForm(u);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        const stored = this.authService.getUser();
        if (stored) {
          this.user.set(stored);
          this.populateForm(stored);
        }
        this.loading.set(false);
      }
    });
  }

  populateForm(user: User): void {
    this.username = user.username || '';
    this.first_name = user.first_name || '';
    this.last_name = user.last_name || '';
    this.email = user.email || '';
    this.phone = user.phone || '';
    this.previewUrl.set(this.authService.getAvatarUrl(user.avatar));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        this.errorMessage.set('Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, WEBP).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('La imagen no debe superar los 5MB.');
        return;
      }

      this.errorMessage.set(null);
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  validate(): boolean {
    this.errorMessage.set(null);

    if (!this.username || !this.username.trim()) {
      this.errorMessage.set('El nombre de usuario es obligatorio.');
      return false;
    }

    if (this.username.trim().length < 3) {
      this.errorMessage.set('El nombre de usuario debe tener al menos 3 caracteres.');
      return false;
    }

    if (this.email && !this.isValidEmail(this.email)) {
      this.errorMessage.set('Ingresa un correo electrónico válido.');
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

    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

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
        this.user.set(updatedUser);
        this.saving.set(false);
        this.successMessage.set('¡Perfil actualizado con éxito!');
        this.selectedFile = null;
        if (updatedUser.avatar) {
          this.previewUrl.set(this.authService.getAvatarUrl(updatedUser.avatar));
        }
        this.toast.success('¡Perfil actualizado con éxito!');
      },
      error: (err) => {
        console.error('Error guardando perfil:', err);
        this.saving.set(false);

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
          const msg = messages.length > 0 ? messages.join(' | ') : 'Error al guardar los datos.';
          this.errorMessage.set(msg);
          this.toast.error(msg);
        } else {
          this.errorMessage.set('Ocurrió un error al actualizar el perfil. Intenta nuevamente.');
          this.toast.error('Ocurrió un error al actualizar el perfil.');
        }
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
