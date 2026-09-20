import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'reservations',
    loadComponent: () => import('./my-reservations.component').then(m => m.MyReservationsComponent)
  },
  {
    path: 'purchases',
    loadComponent: () => import('./my-purchases.component').then(m => m.MyPurchasesComponent)
  }
];
