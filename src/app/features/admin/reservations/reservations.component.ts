import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
      <div class="card"><p class="text-secondary">Módulo de reservas — En construcción</p></div>
    </div>
  `
})
export class ReservationsComponent {}
