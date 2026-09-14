import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cashier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 40px;">
      <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 8px;">Panel Cajero</h1>
      <p class="text-secondary">CU-11 – Confirmar venta presencial — En construcción</p>
    </div>
  `
})
export class CashierComponent {}
