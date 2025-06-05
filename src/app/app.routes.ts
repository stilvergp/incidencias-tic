import {Routes} from '@angular/router';
import {noAuthGuard} from "./guards/no-auth.guard";
import {authGuard} from "./guards/auth.guard";
import {ticRoleGuard} from "./guards/tic-role.guard";
import {adminRoleGuard} from "./guards/admin-role.guard";

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage),
    canActivate: [noAuthGuard]
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./pages/auth/sign-up/sign-up.page').then(m => m.SignUpPage),
    canActivate: [noAuthGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
    canActivate: [noAuthGuard]
  },
  {
    path: 'main',
    loadComponent: () => import('./pages/main/main.page').then( m => m.MainPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'mis-incidencias',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/main/my-incidences/my-incidences.page').then(m => m.MyIncidencesPage)
          },
          {
            path: 'detalles/:id',
            loadComponent: () => import('./pages/main/incidence-details/incidence-details.page').then(m => m.IncidenceDetailsPage)
          }
        ]
      },
      {
        path: 'incidencias',
        canActivate: [ticRoleGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/main/incidences/incidences.page').then( m => m.IncidencesPage)
          },
          {
            path: 'detalles/:id',
            loadComponent: () => import('./pages/main/manage-incidence-details/manage-incidence-details.page').then( m => m.ManageIncidenceDetailsPage)
          }
        ]
      },
      {
        path: 'aulas',
        canActivate: [adminRoleGuard],
        loadComponent: () => import('./pages/main/classrooms/classrooms.page').then( m => m.ClassroomsPage)
      },
      {
        path: 'inventario',
        canActivate: [adminRoleGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/main/devices/devices.page').then( m => m.DevicesPage)
          },
          {
            path: 'detalles/:classroomId/:deviceId',
            loadComponent: () => import('./pages/main/device-details/device-details.page').then(m => m.DeviceDetailsPage)
          }
        ]
      },
      {
        path: 'create-privileged-user',
        canActivate: [adminRoleGuard],
        loadComponent: () => import('./pages/main/create-privileged-user/create-privileged-user.page').then( m => m.CreatePrivilegedUserPage)
      },
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPage)
  },
];
