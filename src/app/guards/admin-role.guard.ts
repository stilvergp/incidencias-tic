import {inject} from "@angular/core";
import {CanActivateFn} from '@angular/router';
import {UtilsService} from "../services/utils.service";

export const adminRoleGuard: CanActivateFn = (route, state) => {
  const utilsService = inject(UtilsService);
  const localStoredUser = utilsService.getLocalStoredUser();

  const hasTicRole = localStoredUser?.tic_role === true;

  return hasTicRole ? true : utilsService.urlTree('/auth');
};
