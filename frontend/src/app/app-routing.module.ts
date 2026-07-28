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
      },

      {
        path: 'juego',
        loadComponent: () =>
          import('./citizen/game/game.component')
            .then(c => c.GameComponent)
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
        redirectTo: 'mapa',
        pathMatch: 'full'
      },

      {
        // Mapa de centros de acopio (visualmente igual al del ciudadano)
        path: 'mapa',
        loadComponent: () =>
          import('./recycler/mapa/mapa.component')
            .then(c => c.MapaComponent)
      },

      {
        path: 'alertas',
        loadComponent: () =>
          import('./recycler/alerts/alerts.component')
            .then(c => c.AlertsComponent)
      },

      {
        path: 'comunidad',
        loadComponent: () =>
          import('./recycler/comunidad/comunidad.component')
            .then(c => c.ComunidadComponent)
      },

    ]

  },

  {
    path: 'admin',
    redirectTo: 'centro-acopio',
    pathMatch: 'full'
  },

  // ===============================
  // CENTRO DE ACOPIO
  // ===============================

  {
    path: 'centro-acopio',

    canActivate: [AuthGuard, RoleGuard],

    data: {
      roles: ['CENTRO_ACOPIO']
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
          import('./centro-acopio/dashboard/dashboard.component')
            .then(c => c.CentroDashboardComponent)
      },

      {
        path: 'capacidad',
        loadComponent: () =>
          import('./centro-acopio/capacidad/capacidad.component')
            .then(c => c.CapacidadComponent)
      },

      {
        path: 'precios',
        loadComponent: () =>
          import('./centro-acopio/precios/precios.component')
            .then(c => c.PreciosComponent)
      },

      {
        path: 'materiales',
        loadComponent: () =>
          import('./centro-acopio/materiales/materiales.component')
            .then(c => c.MaterialesComponent)
      },

      {
        path: 'estado',
        loadComponent: () =>
          import('./centro-acopio/estado/estado.component')
            .then(c => c.EstadoComponent)
      },

      {
        path: 'calificaciones',
        loadComponent: () =>
          import('./centro-acopio/calificaciones/calificaciones.component')
            .then(c => c.CalificacionesComponent)
      },

      {
        path: 'alertas',
        loadComponent: () =>
          import('./centro-acopio/alertas/alertas.component')
            .then(c => c.CentroAlertasComponent)
      },

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
