import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Reservation } from '../../../core/models';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="content-area">
      <div style="padding-top: var(--space-xl); margin-bottom: var(--space-xl);">
        <h1 style="font-size: 1.75rem; font-weight: 800;">Reservas</h1>
        <p class="text-secondary text-sm">CU-09 – Gestión de reservas de prendas</p>
      </div>

      <div class="card" *ngIf="loading">
        <p class="text-secondary">Cargando reservas...</p>
      </div>

      <div class="card" *ngIf="!loading && reservations.length === 0">
        <p class="text-secondary">No hay reservas registradas.</p>
      </div>

      <div class="grid gap-md" *ngIf="!loading && reservations.length > 0">
        <div *ngFor="let reservation of reservations" class="card p-md">
          <div class="flex items-center justify-between mb-sm">
            <div>
              <strong>Reserva #{{ reservation.id }}</strong>
              <div class="text-sm text-secondary">Usuario: {{ reservation.user_id }}</div>
            </div>
            <span class="badge" [ngClass]="{
              'badge-warning': reservation.status === 'pending',
              'badge-success': reservation.status === 'confirmed',
              'badge-primary': reservation.status === 'completed',
              'badge-danger': reservation.status === 'cancelled'
            }">
              {{ reservation.status }}
            </span>
          </div>

          <div class="text-sm text-secondary mb-xs">
            Sucursal: {{ reservation.branch_id }}
          </div>
          <div class="text-sm text-secondary mb-xs">
            Hora de retiro: {{ getPickupDate(reservation) }}
          </div>
          <div class="text-sm text-secondary mb-xs" *ngIf="reservation.notes">
            Nota: {{ reservation.notes }}
          </div>

          <div class="mt-sm flex flex-wrap gap-sm">
            <button class="btn btn-primary btn-sm" (click)="changeStatus(reservation.id, 'confirmed')" *ngIf="reservation.status !== 'confirmed' && reservation.status !== 'completed' && reservation.status !== 'cancelled'">Confirmar</button>
            <button class="btn btn-accent btn-sm" (click)="changeStatus(reservation.id, 'completed')" *ngIf="reservation.status !== 'completed' && reservation.status !== 'cancelled'">Completar</button>
            <button class="btn btn-danger btn-sm" (click)="cancelReservation(reservation.id)" *ngIf="reservation.status !== 'cancelled'">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  loading = false;

  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations() {
    this.loading = true;
    this.api.getReservations().subscribe({
      next: (res) => {
        this.reservations = res || [];
        this.loading = false;
      },
      error: () => {
        this.toast.error('No se pudieron cargar las reservas');
        this.loading = false;
      }
    });
  }

  changeStatus(id: number, status: string) {
    this.api.updateReservationStatus(id, status).subscribe({
      next: () => {
        this.toast.success('Estado actualizado');
        this.loadReservations();
      },
      error: () => this.toast.error('No se pudo cambiar el estado')
    });
  }

  cancelReservation(id: number) {
    this.api.cancelReservation(id).subscribe({
      next: () => {
        this.toast.success('Reserva cancelada');
        this.loadReservations();
      },
      error: () => this.toast.error('No se pudo cancelar la reserva')
    });
  }

  getPickupDate(reservation: Reservation): string {
    if (!reservation.pickup_date) return 'Sin horario definido';
    return new Date(reservation.pickup_date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
