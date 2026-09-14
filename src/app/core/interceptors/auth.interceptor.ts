import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * JWT Interceptor: inyecta el Bearer token en cada request HTTP
 * y maneja expiración automática (401 → logout).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Clonar el request con el header Authorization si hay token
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized → token expirado, hacer logout
      if (error.status === 401) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
