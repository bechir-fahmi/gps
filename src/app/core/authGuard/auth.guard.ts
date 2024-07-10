import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LoginService } from '../../Services/login/login.service';

/**
 * AuthGuard function that checks if the user is logged in.
 *
 * @param {ActivatedRouteSnapshot} route - The route that was requested.
 * @param {RouterStateSnapshot} state - The current state of the router.
 * @return {boolean | UrlTree} Returns true if the user is logged in, otherwise navigates to the login page and returns false.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(LoginService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
