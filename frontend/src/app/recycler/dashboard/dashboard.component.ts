import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogisticsService } from '../../core/services/logistics.service';
import { AuthService } from '../../core/services/auth.service';


interface DashboardData {

  is_available: boolean;

  stats: {

    completed_today: number;

    pending: number;

    distance_today: number;

    level: number;

  };

  current_trip: any | null;

  pending_alerts: any[];

  history: any[];

}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {


  loading = true;

  error = '';

  dashboard!: DashboardData;



  constructor(
    private logistics: LogisticsService,
    public auth: AuthService
  ) {}



  ngOnInit(): void {

    this.loadDashboard();

  }



  loadDashboard(): void {


    this.loading = true;

    this.error = '';



    this.logistics.getDashboard()
      .subscribe({

        next: (data) => {

          this.dashboard = data;

          this.loading = false;

        },


        error: (err: any) => {

          console.error(
            'Error cargando dashboard:',
            err
          );


          this.error =
            'No fue posible cargar el dashboard.';


          this.loading = false;

        }

      });


  }




  toggleAvailability(): void {


    const newAvailability =
      !this.dashboard.is_available;



    this.dashboard.is_available =
      newAvailability;



    this.logistics
      .setAvailability(newAvailability)
      .subscribe({

        error: (err: any) => {

          console.error(
            'Error actualizando disponibilidad:',
            err
          );


          // Revertir cambio si falla

          this.dashboard.is_available =
            !newAvailability;

        }

      });


  }




  acceptTransfer(id: number): void {


    this.logistics
      .aceptarTraslado(id)
      .subscribe({

        next: () => {

          this.loadDashboard();

        },


        error: (err: any) => {

          console.error(
            'Error aceptando traslado:',
            err
          );


          this.error =
            'No se pudo aceptar el traslado.';

        }

      });


  }





  completeTransfer(id: number): void {


    this.logistics
      .completarTraslado(id)
      .subscribe({

        next: () => {

          this.loadDashboard();

        },


        error: (err: any) => {

          console.error(
            'Error completando traslado:',
            err
          );


          this.error =
            'No se pudo completar el traslado.';

        }

      });


  }





  priorityColor(priority: string): string {


    switch (priority) {


      case 'ALTA':

        return '#ef4444';



      case 'MEDIA':

        return '#f59e0b';



      case 'BAJA':

        return '#22c55e';



      default:

        return '#94a3b8';

    }

  }





  priorityLabel(priority: string): string {


    switch (priority) {


      case 'ALTA':

        return 'Alta';



      case 'MEDIA':

        return 'Media';



      case 'BAJA':

        return 'Baja';



      default:

        return priority;

    }

  }





  statusLabel(status: string): string {


    switch (status) {


      case 'PENDIENTE':

        return 'Pendiente';



      case 'ACEPTADA':

        return 'Aceptada';



      case 'EN_PROCESO':

        return 'En proceso';



      case 'COMPLETADA':

        return 'Completada';



      default:

        return status;

    }

  }





  formatDate(date: string | null): string {


    if (!date) {

      return '-';

    }



    return new Date(date)
      .toLocaleString(
        'es-CO',
        {

          dateStyle: 'short',

          timeStyle: 'short'

        }
      );


  }


}
