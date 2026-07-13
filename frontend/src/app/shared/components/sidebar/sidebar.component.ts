import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  user: User | null = null;
  navItems: NavItem[] = [];

  menuCiudadano: NavItem[] = [
    { icon: '🗺️', label: 'Mapa',             route: '/ciudadano/mapa' },
    { icon: '📊', label: 'Capacidad',         route: '/ciudadano/capacidad' },
    { icon: '📚', label: 'Guía de reciclaje', route: '/ciudadano/guias' },
    { icon: '🏆', label: 'Mis logros',        route: '/ciudadano/logros' },
    { icon: '📢', label: 'Propuestas',        route: '/ciudadano/propuestas', badge: 0 },
    { icon: '🚩', label: 'Reportar daño',     route: '/ciudadano/reportar' },
  ];

  menuReciclador: NavItem[] = [
    { icon: '🚨', label: 'Alertas',         route: '/reciclador/alertas', badge: 0 },
    { icon: '🗺️', label: 'Mi zona',         route: '/reciclador/zona' },
    { icon: '📋', label: 'Mis traslados',   route: '/reciclador/traslados' },
    { icon: '📝', label: 'Reportar novedad', route: '/reciclador/novedad' },
    { icon: '📊', label: 'Mi historial',    route: '/reciclador/historial' },
  ];

  menuAdmin: NavItem[] = [
    { icon: '📊', label: 'Dashboard',      route: '/admin/dashboard' },
    { icon: '📍', label: 'Puntos',         route: '/admin/puntos' },
    { icon: '👥', label: 'Usuarios',       route: '/admin/usuarios', badge: 0 },
    { icon: '🚨', label: 'Alertas',        route: '/admin/alertas' },
    { icon: '📢', label: 'Propuestas',     route: '/admin/propuestas', badge: 0 },
    { icon: '🚩', label: 'Reportes',       route: '/admin/reportes' },
    { icon: '📈', label: 'Métricas',       route: '/admin/metricas' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    if (this.user?.role === 'CIUDADANO')  this.navItems = this.menuCiudadano;
    if (this.user?.role === 'RECICLADOR') this.navItems = this.menuReciclador;
    if (this.user?.role === 'ADMIN')      this.navItems = this.menuAdmin;
  }

  get sidebarColor(): string {
    const colors: Record<string, string> = {
      CIUDADANO:  '#2E7D32',
      RECICLADOR: '#0F6E56',
      ADMIN:      '#202124',
    };
    return colors[this.user?.role ?? 'CIUDADANO'];
  }

  get initials(): string {
    const u = this.user;
    if (!u) return '?';
    return (u.username?.charAt(0) ?? '').toUpperCase();
  }

  logout(): void {
    this.auth.logout();
  }
}