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

  // ===============================
  // CIUDADANO
  // ===============================

  {
    path: 'ciudadano',

    canActivate: [AuthGuard, RoleGuard],

    data: {
      roles: ['CIUDADANO']
    },

    loadComponent: () =>
      import('./shared/components/shell/shell.component')
        .then(c => c.ShellComponent),

    children: [

      {
        path: '',
        redirectTo: 'mapa',
        pathMatch: 'full'
      },

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

  // ===============================
  // RECICLADOR
  // ===============================

  {
    path: 'reciclador',

    canActivate: [AuthGuard, RoleGuard],

    data: {
      roles: ['RECICLADOR']
    },

    loadComponent: () =>
      import('./shared/components/shell/shell.component')
        .then(c => c.ShellComponent),

    children: [

      {
        path: '',
        redirectTo: 'alertas',
        pathMatch: 'full'
      },

      {
        path: 'alertas',
        loadComponent: () =>
          import('./recycler/alerts/alerts.component')
            .then(c => c.AlertsComponent)
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./recycler/dashboard/dashboard.component')
            .then(c => c.DashboardComponent)
      },

      {
        path: 'mi-zona',
        loadComponent: () =>
          import('./recycler/my-zone/my-zone.component')
            .then(c => c.MyZoneComponent)
      },

      {
        path: 'reportar',
        loadComponent: () =>
          import('./recycler/report/report.component')
            .then(c => c.ReportComponent)
      },

      {
        path: 'traslados',
        loadComponent: () =>
          import('./recycler/transfers/transfers.component')
            .then(c => c.TransfersComponent)
      }

    ]

  },

  // ===============================
  // ADMIN
  // ===============================

  {
    path: 'admin',

    canActivate: [AuthGuard, RoleGuard],

    data: {
      roles: ['ADMIN']
    },

    loadComponent: () =>
      import('./shared/components/shell/shell.component')
        .then(c => c.ShellComponent),

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

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
