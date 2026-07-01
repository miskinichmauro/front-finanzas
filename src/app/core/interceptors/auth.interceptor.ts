import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const authed = req.clone({ withCredentials: true });

  return next(authed).pipe(
    catchError(err => {
      if (err.status === 401 && !req.url.includes('/api/auth/')) authService.logout(true);
      return throwError(() => err);
    })
  );
};
