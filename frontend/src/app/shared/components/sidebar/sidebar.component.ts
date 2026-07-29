import { Component, OnDestroy, OnInit, Output, EventEmitter, signal, computed } from '@angular/core';
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

  @Output() sidebarClose = new EventEmitter<void>();

  readonly user = signal<User | null>(null);
  readonly navItems = signal<NavItem[]>([]);

  private subscription?: Subscription;

  menuCiudadano: NavItem[] = [
    { icon: '🗺️', label: 'Mapa', route: '/ciudadano/mapa' },
    { icon: '📚', label: 'Guía de reciclaje', route: '/ciudadano/guias' },
    { icon: '🏆', label: 'Mis logros', route: '/ciudadano/logros' },
    { icon: '🎮', label: 'Juego de reciclaje', route: '/ciudadano/juego' }
  ];

  menuReciclador: NavItem[] = [
    { icon: '🗺️', label: 'Centros de Acopio', route: '/reciclador/mapa' },
    { icon: '🚨', label: 'Alertas', route: '/reciclador/alertas', badge: 0 },
    { icon: '🌐', label: 'Comunidad', route: '/reciclador/comunidad' }
  ];

  menuCentroAcopio: NavItem[] = [
    { icon: '📊', label: 'Dashboard', route: '/centro-acopio/dashboard' },
    { icon: '🚨', label: 'Alertas y Avisos', route: '/centro-acopio/alertas' },
    { icon: '⚖️', label: 'Gestionar Capacidad', route: '/centro-acopio/capacidad' },
    { icon: '💰', label: 'Precios por Kg', route: '/centro-acopio/precios' },
    { icon: '♻️', label: 'Materiales', route: '/centro-acopio/materiales' },
    { icon: '🔄', label: 'Estado del Centro', route: '/centro-acopio/estado' },
    { icon: '⭐', label: 'Calificaciones', route: '/centro-acopio/calificaciones' }
  ];

  readonly sidebarColor = computed(() => {
    const u = this.user();
    const colors: Record<string, string> = {
      CIUDADANO:     '#2E7D32',
      RECICLADOR:    '#0F6E56',
      CENTRO_ACOPIO: '#1565C0',
    };
    return colors[u?.role ?? 'CIUDADANO'];
  });

  readonly avatarUrl = computed(() => {
    const u = this.user();
    return this.auth.getAvatarUrl(u?.avatar);
  });

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return u.username ? u.username.charAt(0).toUpperCase() : '?';
  });

  constructor(
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe(u => {
      this.user.set(u);

      switch (u?.role) {
        case 'CIUDADANO':
          this.navItems.set(this.menuCiudadano);
          break;
        case 'RECICLADOR':
          this.navItems.set(this.menuReciclador);
          break;
        case 'CENTRO_ACOPIO':
          this.navItems.set(this.menuCentroAcopio);
          break;
        default:
          this.navItems.set([]);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
  }

  onNavClick(): void {
    // Close sidebar on mobile after navigation
    this.sidebarClose.emit();
  }

}
