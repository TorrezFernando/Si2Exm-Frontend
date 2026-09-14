import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  products: Product[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private toast: ToastService,
    public authService: AuthService,
    public cartService: CartService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.api.getProducts().subscribe({
      next: (res: Product[]) => {
        this.products = res;
        this.loading = false;
      },
      error: (err: any) => {
        this.toast.error('Error al cargar el catálogo');
        this.loading = false;
      }
    });
  }

  addToCart(product: Product) {
    if (!this.authService.isLoggedIn()) {
      this.toast.warning('Debes iniciar sesión para añadir productos al carrito.');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    // Asumimos que se añade la variante principal si no se seleccionó ninguna (para simplificar por ahora)
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    this.cartService.addToCart(product, variant, 1);
    
    this.toast.success(`Se añadió ${product.name} al carrito`);
  }

  viewProduct(product: Product) {
    this.router.navigate(['/catalog/product', product.id]);
  }
}
