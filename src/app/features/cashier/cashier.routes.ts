import { Routes } from '@angular/router';

export const cashierRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./cashier.component').then(m => m.CashierComponent)
  }
];
