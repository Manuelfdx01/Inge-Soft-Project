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
    },
    {
      icon: '🎮',
      label: 'Juego de reciclaje',
      route: '/ciudadano/juego'
    }
  ];

  // ===========================
  // MENÚ RECICLADOR
  // ===========================

  menuReciclador: NavItem[] = [
    {
      icon: '🗺️',
      label: 'Centros de Acopio',
      route: '/reciclador/mapa'
    },
    {
      icon: '🚨',
      label: 'Alertas',
      route: '/reciclador/alertas',
      badge: 0
    },
    {
      icon: '📝',
      label: 'Reportar',
      route: '/reciclador/reportar'
    },
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

  // ===========================
  // MENÚ CENTRO DE ACOPIO
  // ===========================

  menuCentroAcopio: NavItem[] = [
    {
      icon: '📊',
      label: 'Dashboard',
      route: '/centro-acopio/dashboard'
    },
    {
      icon: '⚖️',
      label: 'Gestionar Capacidad',
      route: '/centro-acopio/capacidad'
    },
    {
      icon: '💰',
      label: 'Precios por Kg',
      route: '/centro-acopio/precios'
    },
    {
      icon: '♻️',
      label: 'Materiales',
      route: '/centro-acopio/materiales'
    },
    {
      icon: '🔄',
      label: 'Estado del Centro',
      route: '/centro-acopio/estado'
    },
    {
      icon: '⭐',
      label: 'Calificaciones',
      route: '/centro-acopio/calificaciones'
    },
    {
      icon: '📋',
      label: 'Reportes',
      route: '/centro-acopio/reportes'
    },
    {
      icon: '🔔',
      label: 'Notificaciones',
      route: '/centro-acopio/notificaciones'
    },
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

        case 'CENTRO_ACOPIO':
          this.navItems = this.menuCentroAcopio;
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
      CIUDADANO:     '#2E7D32',
      RECICLADOR:    '#0F6E56',
      ADMIN:         '#202124',
      CENTRO_ACOPIO: '#1565C0',
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
