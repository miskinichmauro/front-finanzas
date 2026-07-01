import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  mode        = signal<'login' | 'register'>('login');

  email       = '';
  password    = '';
  name        = '';
  confirmPass = '';

  loading     = signal(false);
  error       = signal('');
  showPass    = signal(false);
  showConfirm = signal(false);
  submitted   = signal(false);
  expired     = signal(history.state?.expired === true);

  switchMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.error.set('');
    this.submitted.set(false);
    this.expired.set(false);
  }

  isNameInvalid(): boolean    { return this.submitted() && this.mode() === 'register' && !this.name.trim(); }
  isEmailInvalid(): boolean   { return this.submitted() && !this.email.trim(); }
  isPasswordInvalid(): boolean { return this.submitted() && !this.password.trim(); }
  isConfirmInvalid(): boolean {
    return this.submitted() && this.mode() === 'register' && this.password !== this.confirmPass;
  }

  submit(): void {
    this.submitted.set(true);
    if (this.mode() === 'login') this.doLogin();
    else this.doRegister();
  }

  private doLogin(): void {
    if (!this.email.trim() || !this.password.trim()) { this.error.set(''); return; }
    this.loading.set(true);
    this.error.set('');
    this.expired.set(false);
    this.auth.login(this.email, this.password).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.status === 401
          ? 'Email o contraseña incorrectos.'
          : 'No pudimos iniciar sesión. Por favor, intentalo de nuevo más tarde.');
        this.loading.set(false);
      }
    });
  }

  private doRegister(): void {
    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) { this.error.set(''); return; }
    if (this.password !== this.confirmPass) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.name.trim(), this.email.trim(), this.password).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.status === 409
          ? 'Ya existe una cuenta con ese email.'
          : 'No pudimos crear la cuenta. Por favor, intentalo de nuevo.');
        this.loading.set(false);
      }
    });
  }
}


