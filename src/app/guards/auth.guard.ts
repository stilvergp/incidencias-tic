import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { UtilsService } from '../services/utils.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const firebaseService = inject(FirebaseService);
  const utilsService = inject(UtilsService);

  const isAuthenticated = await firebaseService.isAuthenticated();
  const localStorageUser = localStorage.getItem('user');

  if (isAuthenticated && localStorageUser) {
    return true;
  } else {
    await firebaseService.signOut();
    return utilsService.urlTree('/auth');
  }
};
