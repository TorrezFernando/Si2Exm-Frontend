import { Routes } from '@angular/router';

export const cartRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./cart.component').then(m => m.CartComponent)
  }
];
