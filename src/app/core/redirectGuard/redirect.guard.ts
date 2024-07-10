import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LoginService } from '../../Services/login/login.service';

@Injectable({
  providedIn: 'root',
})
export class redirectGuard implements CanActivate {
  constructor(private authService: LoginService, private router: Router) {}
  /**
   * A description of the entire function.
   *
   * @return {boolean} description of return value
   */
  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/map']);
      return false;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
