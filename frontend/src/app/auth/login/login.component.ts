import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { username, password } = this.form.value;

    this.auth.login(username, password).subscribe({
      next: (res) => {
        this.loading = false;
        const role = res.user?.role;
        if (role === 'CIUDADANO')      this.router.navigate(['/ciudadano/mapa']);
        if (role === 'RECICLADOR')     this.router.navigate(['/reciclador/mapa']);
        if (role === 'CENTRO_ACOPIO') this.router.navigate(['/centro-acopio/dashboard']);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Usuario o contraseña incorrectos.';
        this.toast.error('Usuario o contraseña incorrectos.');
        this.cdr.markForCheck();
      },
    });
  }
}
