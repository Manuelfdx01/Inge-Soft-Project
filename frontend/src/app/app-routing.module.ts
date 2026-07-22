import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component')
        .then(c => c.LoginComponent)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component')
        .then(c => c.RegisterComponent)
  },


  {
    path: 'ciudadano',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CIUDADANO'] },
    children: [
      {
        path: 'mapa',
        loadComponent: () =>
          import('./citizen/map/map.component')
            .then(c => c.MapComponent)
      },
      {
        path: 'guias',
        loadComponent: () =>
          import('./citizen/guides/guides.component')
            .then(c => c.GuidesComponent)
      },
      {
        path: 'logros',
        loadComponent: () =>
          import('./citizen/achievements/achievements.component')
            .then(c => c.AchievementsComponent)
      }
    ]
  },


  {
    path: 'reciclador',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['RECICLADOR'] },
    children: [
      {
        path: 'alertas',
        loadComponent: () =>
          import('./recycler/alerts/alerts.component')
            .then(c => c.AlertsComponent)
      }
    ]
  },


  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component')
            .then(c => c.DashboardComponent)
      }
    ]
  },


  {
    path: '**',
    redirectTo: 'login'
  }
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
