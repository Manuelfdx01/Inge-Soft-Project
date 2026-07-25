import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, User } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {

  user: User | null = null;

  navItems: NavItem[] = [];

  private subscription?: Subscription;

  // ===========================
  // MENÚ CIUDADANO
  // ===========================

  menuCiudadano: NavItem[] = [
    {
      icon: '🗺️',
      label: 'Mapa',
      route: '/ciudadano/mapa'
    },
    {
      icon: '📚',
      label: 'Guía de reciclaje',
      route: '/ciudadano/guias'
    },
    {
      icon: '🏆',
      label: 'Mis logros',
      route: '/ciudadano/logros'
    }
  ];

  // ===========================
  // MENÚ RECICLADOR
  // ===========================

  menuReciclador: NavItem[] = [
    {
      icon: '📊',
      label: 'Dashboard',
      route: '/reciclador/dashboard'
    },
    {
      icon: '🚨',
      label: 'Alertas',
      route: '/reciclador/alertas',
      badge: 0
    },
    {
      icon: '🗺️',
      label: 'Mi zona',
      route: '/reciclador/mi-zona'
    },
    {
      icon: '📝',
      label: 'Reportar capacidad',
      route: '/reciclador/reportar'
    },
    {
      icon: '🚚',
      label: 'Traslados',
      route: '/reciclador/traslados'
    }
  ];

  // ===========================
  // MENÚ ADMIN
  // ===========================

  menuAdmin: NavItem[] = [
    {
      icon: '📊',
      label: 'Dashboard',
      route: '/admin/dashboard'
    }
  ];

  constructor(
    private auth: AuthService
  ) {}

  ngOnInit(): void {

    this.subscription = this.auth.currentUser$.subscribe(user => {

      this.user = user;

      switch (user?.role) {

        case 'CIUDADANO':
          this.navItems = this.menuCiudadano;
          break;

        case 'RECICLADOR':
          this.navItems = this.menuReciclador;
          break;

        case 'ADMIN':
          this.navItems = this.menuAdmin;
          break;

        default:
          this.navItems = [];
      }

    });

  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get sidebarColor(): string {

    const colors: Record<string, string> = {
      CIUDADANO: '#2E7D32',
      RECICLADOR: '#0F6E56',
      ADMIN: '#202124'
    };

    return colors[this.user?.role ?? 'CIUDADANO'];

  }

  get initials(): string {

    if (!this.user) {
      return '?';
    }

    return this.user.username.charAt(0).toUpperCase();

  }

  logout(): void {
    this.auth.logout();
  }

}
