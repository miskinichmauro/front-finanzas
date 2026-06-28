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

  email       = '';
  password    = '';
  loading     = signal(false);
  error       = signal('');
  showPass    = signal(false);

  submit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error.set('Email o contraseña incorrectos.');
        this.loading.set(false);
      }
    });
  }
}
