import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { 
  BehaviorSubject, 
  Observable, 
  throwError, 
  catchError, 
  tap, 
  EMPTY,
  filter,
  take,
  map
} from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  displayName: string;
  email: string;
  dateCreated: string;
  lastLogin?: string;
  preferences?: UserPreferences;
  role?: 'user' | 'admin';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language: string;
  timezone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'currentUser';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from storage
   */
  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user && !this.isTokenExpired()) {
      this.currentUserSubject.next(user);
      // Silent refresh if token is about to expire
      if (this.shouldRefreshToken()) {
        this.silentRefresh().subscribe();
      }
    } else if (token && this.isTokenExpired()) {
      this.logout(); // Auto-logout if token is expired
    }
  }

  /**
   * User login with enhanced security
   */
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap(response => this.handleAuthSuccess(response, data.rememberMe)),
      catchError(error => this.handleAuthError('login', error))
    );
  }

  /**
   * User registration with validation
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        console.log('✅ Registration successful:', response.message);
      }),
      catchError(error => this.handleAuthError('register', error))
    );
  }

  /**
   * Update user profile
   */
  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/profile`, data).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.storeUser(user);
        console.log('✅ Profile updated successfully');
      }),
      catchError(error => this.handleAuthError('updateProfile', error))
    );
  }

  /**
   * Change user password
   */
  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/change-password`, data).pipe(
      tap(response => {
        console.log('✅ Password changed successfully');
      }),
      catchError(error => this.handleAuthError('changePassword', error))
    );
  }

  /**
   * Request password reset
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
      catchError(error => this.handleAuthError('forgotPassword', error))
    );
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
      confirmPassword
    }).pipe(
      catchError(error => this.handleAuthError('resetPassword', error))
    );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.logout();
      return throwError(() => ({ message: 'No refresh token available', code: 'NO_REFRESH_TOKEN' }));
    }

    if (this.isRefreshing) {
      // Return the token as part of a mock AuthResponse
      return this.refreshTokenSubject.asObservable().pipe(
        filter((token: string | null) => token !== null),
        take(1),
        map((token: string | null) => ({
          accessToken: token!,
          refreshToken: this.getRefreshToken()!, // Get current refresh token
          user: this.getCurrentUser()!, // Get current user
          expiresIn: 3600 // Default expiry time
        } as AuthResponse)),
        catchError(() => {
          this.logout();
          return EMPTY;
        })
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.handleAuthSuccess(response, this.isRememberMeEnabled());
        this.isRefreshing = false;
        this.refreshTokenSubject.next(response.accessToken);
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.logout();
        return this.handleAuthError('refreshToken', error);
      })
    );
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * User logout with cleanup
   */
  logout(redirect: boolean = true): void {
    const refreshToken = this.getRefreshToken();
    
    // Call logout endpoint if token exists
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        error: (error) => console.warn('Logout endpoint error:', error)
      });
    }

    // Clear all storage
    this.clearStorage();

    // Reset state
    this.currentUserSubject.next(null);
    this.isRefreshing = false;
    this.refreshTokenSubject.next(null);

    console.log('👋 User logged out');

    // Redirect to login
    if (redirect) {
      this.router.navigate(['/login'], {
        queryParams: { redirect: this.router.url }
      });
    }
  }

  /**
   * Get user preferences
   */
  getPreferences(): UserPreferences {
    const user = this.getCurrentUser();
    return user?.preferences || this.getDefaultPreferences();
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): Observable<User> {
    return this.updateProfile({ preferences });
  }

  // Private helper methods

  private handleAuthSuccess(response: AuthResponse, rememberMe: boolean = false): void {
    this.storeToken(response.accessToken, rememberMe);
    this.storeRefreshToken(response.refreshToken, rememberMe);
    this.storeUser(response.user);
    this.setTokenExpiry(response.expiresIn);
    
    this.currentUserSubject.next(response.user);
    
    console.log('✅ Authentication successful');
  }

  private storeToken(token: string, persistent: boolean = false): void {
    if (persistent) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private storeRefreshToken(token: string, persistent: boolean = false): void {
    if (persistent) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  private storeUser(user: User): void {
    const storage = this.isRememberMeEnabled() ? localStorage : sessionStorage;
    storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private setTokenExpiry(expiresIn: number): void {
    const expiryTime = Date.now() + (expiresIn * 1000);
    const storage = this.isRememberMeEnabled() ? localStorage : sessionStorage;
    storage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY) || sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    return Date.now() >= parseInt(expiry, 10);
  }

  private shouldRefreshToken(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY) || sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return false;
    
    const timeUntilExpiry = parseInt(expiry, 10) - Date.now();
    return timeUntilExpiry < (5 * 60 * 1000); // Refresh if less than 5 minutes remaining
  }

  private isRememberMeEnabled(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private silentRefresh(): Observable<AuthResponse> {
    return this.refreshToken().pipe(
      catchError(error => {
        console.warn('Silent refresh failed:', error);
        this.logout(false); // Don't redirect immediately
        return EMPTY;
      })
    );
  }

  private clearStorage(): void {
    // Clear both storage types to be safe
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.TOKEN_EXPIRY_KEY);
    });
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      notifications: true,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private handleAuthError(operation: string, error: HttpErrorResponse): Observable<never> {
    console.error(`❌ AuthService.${operation} failed:`, error);

    let message = 'An unexpected error occurred. Please try again.';
    let code = 'UNKNOWN_ERROR';

    switch (error.status) {
      case 0:
        message = 'Unable to connect to the server. Please check your internet connection.';
        code = 'NETWORK_ERROR';
        break;
      case 400:
        message = error.error?.message || 'Invalid request. Please check your input.';
        code = 'BAD_REQUEST';
        break;
      case 401:
        message = error.error?.message || 'Invalid email or password.';
        code = 'UNAUTHORIZED';
        // Auto-logout on 401 errors (except for login)
        if (operation !== 'login') {
          setTimeout(() => this.logout(), 2000);
        }
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        code = 'FORBIDDEN';
        break;
      case 409:
        message = error.error?.message || 'A user with this email already exists.';
        code = 'CONFLICT';
        break;
      case 429:
        message = 'Too many attempts. Please try again later.';
        code = 'RATE_LIMIT';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        code = 'SERVER_ERROR';
        break;
    }

    // Include validation errors if available
    if (error.error?.errors) {
      const validationErrors = Object.values(error.error.errors).flat() as string[];
      message = validationErrors.join(', ');
      code = 'VALIDATION_ERROR';
    } else if (error.error?.message) {
      message = error.error.message;
    }

    return throwError(() => ({ 
      message, 
      code,
      details: error.error?.details 
    } as ApiError));
  }
}