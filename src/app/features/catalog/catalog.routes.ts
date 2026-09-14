import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./product-detail.component').then(m => m.ProductDetailComponent)
  }
];
