import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  roles = [
    { value: 'CIUDADANO',  label: 'Ciudadano' },
    { value: 'RECICLADOR', label: 'Reciclador' },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
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

    this.http.post('http://localhost:8000/api/users/register/', this.form.value)
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = '¡Cuenta creada! Inicia sesión.';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err.error?.email?.[0] ?? 'Error al registrarse.';
        },
      });
  }
}