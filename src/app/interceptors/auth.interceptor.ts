import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { throwError, BehaviorSubject, Observable } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh');
  const token = authService.getAccessToken();
  let authReq = req;
  
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      // Catch 401 responses for non-auth endpoints to trigger token refresh
      if (error.status === 401 && !isAuthEndpoint) {
        return handle401Error(authReq, next, authService, router);
      }
      
      // Extract API validation errors cleanly
      return throwError(() => {
        if (error.error) {
          if (error.error.message) {
            return {
              status: error.status,
              code: error.error.code || 'VALIDATION_ERROR',
              message: error.error.message
            };
          }
          if (error.error.error) {
            return {
              status: error.status,
              code: 'VALIDATION_ERROR',
              message: error.error.error
            };
          }
        }
        
        // Handle explicit 401 on login
        if (error.status === 401) {
          return {
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password.'
          };
        }
        
        return {
          status: error.status,
          code: 'CONNECTION_ERROR',
          message: error.message || 'An unexpected network error occurred.'
        };
      });
    })
  );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService, router: Router): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(res => {
        isRefreshing = false;
        refreshTokenSubject.next(res.accessToken);
        
        // Retry the failed request with the new access token
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${res.accessToken}`
          }
        }));
      }),
      catchError(err => {
        isRefreshing = false;
        authService.clearSession();
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  } else {
    // Queue concurrent requests while token refresh is in progress
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        }));
      })
    );
  }
}
