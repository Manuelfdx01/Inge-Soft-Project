import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
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
        if (role === 'CIUDADANO')  this.router.navigate(['/ciudadano/mapa']);
        if (role === 'RECICLADOR') this.router.navigate(['/reciclador/alertas']);
        if (role === 'ADMIN')      this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Usuario o contraseña incorrectos.';
      },
    });
  }
}
