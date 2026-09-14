import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant, Inventory } from '../../core/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="content-area" style="max-width: 1200px; margin: 0 auto; padding-top: var(--space-xl);">
      <button class="btn btn-outline btn-sm mb-lg" (click)="goBack()">← Volver al catálogo</button>

      <div *ngIf="loading()" class="flex justify-center p-xl">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!loading() && !product()" class="card card-glass text-center p-xl mt-lg">
        <h3 class="font-semibold text-xl mb-sm">Producto no encontrado</h3>
        <button class="btn btn-primary" (click)="goBack()">Ir a la tienda</button>
      </div>

      <div *ngIf="!loading() && product()" class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-xl); align-items: start;">
        
        <!-- Galería de imágenes -->
        <div class="card card-glass" style="padding: 0; overflow: hidden;">
          <div style="background: var(--bg-hover); aspect-ratio: 4/5; position: relative;">
            <img *ngIf="displayImage()" [src]="displayImage()" [alt]="product()?.name" style="width: 100%; height: 100%; object-fit: cover;">
            <div *ngIf="!displayImage()" class="flex justify-center items-center h-full text-muted">
              <span>Sin imagen</span>
            </div>
          </div>
        </div>

        <!-- Detalles e interacciones -->
        <div class="flex-col gap-lg">
          <div>
            <div class="flex items-center gap-sm mb-xs">
              <span *ngIf="product()?.season" class="badge badge-primary">{{ product()?.season }}</span>
              <span class="text-secondary text-sm">{{ product()?.category?.name || 'Categoría general' }}</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 800; line-height: 1.2;">{{ product()?.name }}</h1>
            <div class="font-bold text-3xl text-primary mt-sm">\${{ (selectedVariant()?.price_override ?? product()?.base_price)?.toFixed(2) }}</div>
          </div>

          <div class="text-secondary" style="line-height: 1.6;">
            {{ product()?.description || 'Este producto no cuenta con descripción adicional.' }}
          </div>
          
          <!-- Botón de prueba IA (Placeholder) -->
          <div class="p-md rounded border" style="background: rgba(108, 99, 255, 0.05); border-color: rgba(108, 99, 255, 0.2);">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-primary flex items-center gap-xs">
                  ✨ Vestidor Virtual IA
                </h4>
                <p class="text-sm text-secondary mt-xs">Sube una foto tuya para ver cómo te queda esta prenda (Próximamente).</p>
              </div>
              <button class="btn btn-sm btn-outline" style="border-color: var(--color-primary); color: var(--color-primary);" (click)="tryVirtual()">Probar</button>
            </div>
          </div>

          <div class="border-t pt-md" *ngIf="variants().length > 0">
            <h3 class="font-semibold mb-sm">Variantes Disponibles</h3>
            
            <div class="grid grid-2 gap-sm">
              <button *ngFor="let variant of variants()" 
                      class="btn w-full"
                      style="justify-content: flex-start; text-align: left;"
                      [ngClass]="selectedVariant()?.id === variant.id ? 'btn-primary' : 'btn-outline'"
                      (click)="selectVariant(variant)">
                <div class="flex-col items-start gap-xs">
                  <span>Talla: <strong>{{ variant.size }}</strong> | Color: {{ variant.color }}</span>
                </div>
              </button>
            </div>
          </div>

          <div *ngIf="selectedVariant() && inventory().length > 0" class="border-t pt-md">
            <h3 class="font-semibold mb-sm">Disponibilidad en Sucursales</h3>
            <div class="flex-col gap-xs">
              <div *ngFor="let inv of inventory()" class="flex justify-between items-center p-sm border rounded" style="background: var(--bg-card);">
                <span class="font-medium">{{ inv.branch?.name || 'Sucursal ' + inv.branch_id }}</span>
                <span class="badge" [ngClass]="inv.stock > 0 ? 'badge-success' : 'badge-danger'">
                  {{ inv.stock > 0 ? inv.stock + ' en stock' : 'Agotado' }}
                </span>
              </div>
            </div>
          </div>
          
          <div *ngIf="selectedVariant() && inventory().length === 0" class="border-t pt-md">
            <p class="text-secondary text-sm">Consultando inventario...</p>
          </div>

          <div class="pt-md mt-auto">
            <button class="btn btn-accent w-full" style="padding: var(--space-md) 0; font-size: 1.1rem;" 
                    (click)="addToCart()"
                    [disabled]="selectedVariant() && totalStock() === 0">
              🛒 Añadir al Carrito
            </button>
            <p *ngIf="selectedVariant() && totalStock() === 0" class="text-danger text-sm text-center mt-sm">Esta variante está agotada en todas las sucursales.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  loading = signal(true);
  product = signal<Product | null>(null);
  
  variants = computed(() => this.product()?.variants || []);
  selectedVariant = signal<ProductVariant | null>(null);
  
  inventory = signal<Inventory[]>([]);
  
  totalStock = computed(() => this.inventory().reduce((acc, inv) => acc + inv.stock, 0));
  
  displayImage = computed(() => {
    if (this.selectedVariant()?.image_url) {
      return this.selectedVariant()!.image_url;
    }
    return this.product()?.image_url;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadProduct(Number(idParam));
    } else {
      this.loading.set(false);
    }
  }

  loadProduct(id: number) {
    this.loading.set(true);
    this.api.getProductById(id).subscribe({
      next: (prod) => {
        this.product.set(prod);
        if (prod.variants && prod.variants.length > 0) {
          this.selectVariant(prod.variants[0]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el producto.');
        this.loading.set(false);
      }
    });
  }

  selectVariant(variant: ProductVariant) {
    this.selectedVariant.set(variant);
    this.loadInventory(variant.id);
  }
  
  loadInventory(variantId: number) {
    this.inventory.set([]);
    this.api.getStockByVariant(variantId).subscribe({
      next: (inv) => {
        this.inventory.set(inv);
      },
      error: () => {
        console.error('Error loading inventory');
      }
    });
  }

  addToCart() {
    const prod = this.product();
    if (!prod) return;
    
    // Si el producto tiene variantes, pero ninguna está seleccionada
    if (this.variants().length > 0 && !this.selectedVariant()) {
      this.toast.warning('Por favor selecciona una talla/color.');
      return;
    }
    
    if (this.selectedVariant() && this.totalStock() === 0) {
      this.toast.error('Este producto está fuera de stock y no puede ser añadido al carrito.');
      return;
    }
    
    this.cartService.addToCart(prod, this.selectedVariant() || undefined, 1);
    this.toast.success(`Se añadió al carrito`);
    
    // Trigger animation
    const cartBtn = document.querySelector('.cart-button-anim');
    if (cartBtn) {
      cartBtn.classList.add('animate-bounce-short');
      setTimeout(() => cartBtn.classList.remove('animate-bounce-short'), 500);
    }
  }

  goBack() {
    this.router.navigate(['/catalog']);
  }
  
  tryVirtual() {
    this.toast.info('La función de Vestidor Virtual con IA está en desarrollo. ¡Pronto podrás subir tu foto!');
  }
}
