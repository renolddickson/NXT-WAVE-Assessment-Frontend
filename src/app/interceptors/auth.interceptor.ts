import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { throwError, BehaviorSubject, Observable } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip token attachment for auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = authService.getAccessToken();
  let authReq = req;
  
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      // Catch 401 responses
      if (error.status === 401) {
        return handle401Error(authReq, next, authService);
      }
      // Extract API validation errors cleanly
      return throwError(() => {
        if (error.error && error.error.message) {
          return {
            status: error.status,
            code: error.error.code || 'UNKNOWN_ERROR',
            message: error.error.message
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

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
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
        authService.logout();
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
