import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule),
  },

  {
    path: 'ciudadano',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CIUDADANO'] },
    loadChildren: () =>
      import('./citizen/citizen.module').then(m => m.CitizenModule),
  },

  {
    path: 'reciclador',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['RECICLADOR'] },
    loadChildren: () =>
      import('./recycler/recycler.module').then(m => m.RecyclerModule),
  },

  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminModule),
  },

  { path: 'no-autorizado', loadChildren: () =>
      import('./shared/shared.module').then(m => m.SharedModule) },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}