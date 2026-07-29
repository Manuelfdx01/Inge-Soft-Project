import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService, CentroAlerta } from '../../core/services/centro-acopio.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-centro-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.component.html',
  styleUrl: './alertas.component.scss'
})
export class CentroAlertasComponent implements OnInit {
  readonly alertas = signal<CentroAlerta[]>([]);
  readonly loading = signal(true);
  readonly publishing = signal(false);
  readonly errorMsg = signal('');

  tipoSeleccionado = 'AVISO';
  mensajeAlerta = '';

  readonly tipos = [
    { value: 'AVISO', label: '📢 Aviso General', desc: 'Información general sobre la operación del centro' },
    { value: 'PRECIO', label: '💰 Cambio de Precios', desc: 'Actualización en la tarifa por kg comprada' },
    { value: 'HORARIO', label: '🕒 Cambio de Horario', desc: 'Ajuste en las horas de atención al público' },
    { value: 'CIERRE', label: '🔴 Cierre / Mantenimiento', desc: 'Notificación de suspensión temporal de servicio' },
  ];

  constructor(
    private centroService: CentroAcopioService,
    private notifService: NotificationsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.loading.set(true);
    this.centroService.getAlertas().subscribe({
      next: (data: CentroAlerta[]) => {
        this.alertas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los avisos.');
        this.loading.set(false);
        this.toast.error('No se pudieron cargar los avisos.');
      }
    });
  }

  publicar(): void {
    if (!this.mensajeAlerta.trim()) {
      this.errorMsg.set('Por favor escribe el mensaje de la alerta.');
      this.toast.warning('Por favor escribe el mensaje de la alerta.');
      return;
    }

    this.publishing.set(true);
    this.errorMsg.set('');

    this.centroService.publicarAlerta(this.tipoSeleccionado, this.mensajeAlerta.trim()).subscribe({
      next: () => {
        this.mensajeAlerta = '';
        this.publishing.set(false);
        this.cargarAlertas();
        this.notifService.getUnreadCount();
        this.toast.success('Alerta publicada y enviada a los recicladores.');
      },
      error: (err: any) => {
        const msg = err.error?.error || 'Error al publicar la alerta.';
        this.errorMsg.set(msg);
        this.publishing.set(false);
        this.toast.error(msg);
      }
    });
  }

  tipoIcon(msg: string): string {
    if (msg.includes('(PRECIO)')) return '💰';
    if (msg.includes('(HORARIO)')) return '🕒';
    if (msg.includes('(CIERRE)')) return '🔴';
    return '📢';
  }
}
