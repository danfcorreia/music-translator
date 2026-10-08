import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = false;

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin') {
      this.loggedIn = true;
      sessionStorage.setItem('auth', 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    this.loggedIn = false;
    sessionStorage.removeItem('auth');
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem('auth') === 'true';
  }
}
