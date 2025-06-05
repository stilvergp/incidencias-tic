import {CanActivateFn} from '@angular/router';
import {FirebaseService} from '../services/firebase.service';
import {UtilsService} from '../services/utils.service';
import {inject} from '@angular/core';

export const noAuthGuard: CanActivateFn = async (route, state) => {
  const firebaseService = inject(FirebaseService);
  const utilsService = inject(UtilsService);

  const isAuthenticated = await firebaseService.isAuthenticated();

  if (isAuthenticated) {
    let user = utilsService.getLocalStoredUser()!;

    return utilsService.urlTree(user.tic_role === 1 ? 'main/incidencias' : 'main/mis-incidencias');
  } else {
    return true;
  }
};
