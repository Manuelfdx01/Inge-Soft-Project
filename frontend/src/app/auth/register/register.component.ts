import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  roles = [
    { value: 'CIUDADANO',     label: '🏙️ Ciudadano' },
    { value: 'RECICLADOR',    label: '♻️ Reciclador' },
    { value: 'CENTRO_ACOPIO', label: '🏭 Centro de Acopio' },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role:     ['CIUDADANO', Validators.required],
      phone:    [''],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.http.post(`${environment.apiUrl}/users/register/`, this.form.value)
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = '¡Cuenta creada! Inicia sesión.';
          this.toast.success('¡Cuenta creada con éxito! Redirigiendo al login...');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.loading = false;
          const errors = err.error;
          this.errorMsg =
            errors?.email?.[0] ??
            errors?.role?.[0] ??
            errors?.username?.[0] ??
            'Error al registrarse.';
          this.toast.error(this.errorMsg);
        },
      });
  }
}
