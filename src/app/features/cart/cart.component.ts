import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="content-area">
      <div class="flex items-center justify-between" style="padding-top: var(--space-xl); margin-bottom: var(--space-xl);">
        <div>
          <h1 style="font-size: 2.25rem; font-weight: 800;">Tu Carrito de Compras</h1>
          <p class="text-secondary mt-sm">Revisa tus productos antes de finalizar la compra.</p>
        </div>
        <button class="btn btn-outline" (click)="router.navigate(['/catalog'])">Volver al Catálogo</button>
      </div>

      <!-- Contenido del carrito vacío -->
      <div *ngIf="cartItems().length === 0" class="card card-glass text-center p-xl mt-lg">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">🛒</div>
        <h3 class="font-semibold text-xl mb-sm">Tu carrito está vacío</h3>
        <p class="text-secondary mb-md">Agrega algunos productos increíbles para empezar.</p>
        <button class="btn btn-primary" (click)="router.navigate(['/catalog'])">Ir a la tienda</button>
      </div>

      <!-- Grid principal si hay items -->
      <div *ngIf="cartItems().length > 0" class="grid" style="grid-template-columns: 2fr 1fr; gap: var(--space-lg);">
        <!-- Lista de Productos -->
        <div class="card flex-col gap-md">
          <h2 class="font-bold text-lg mb-sm border-b pb-sm">Productos Seleccionados</h2>
          
          <div *ngFor="let item of cartItems(); let i = index" class="flex justify-between items-center border-b pb-sm">
            <div class="flex items-center gap-md">
              <div style="width: 60px; height: 60px; background: var(--bg-hover); border-radius: var(--radius-sm); overflow: hidden;">
                <img *ngIf="item.variant?.image_url || item.product.image_url" [src]="item.variant?.image_url || item.product.image_url" alt="" style="width:100%; height:100%; object-fit: cover;">
              </div>
              <div>
                <h4 class="font-semibold">{{ item.product.name }}</h4>
                <p class="text-secondary text-sm">
                  {{ item.variant ? 'Variante: ' + item.variant.color + ' - Talla ' + item.variant.size : 'Variante base' }}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-lg">
              <div class="font-semibold text-lg">\${{ item.unit_price.toFixed(2) }}</div>
              <div class="flex items-center gap-sm">
                <span class="text-sm">Cant: {{ item.quantity }}</span>
              </div>
              <button class="btn btn-sm btn-outline text-danger" (click)="removeItem(i)">✕</button>
            </div>
          </div>
        </div>

        <!-- Resumen de Compra -->
        <div class="card card-glass" style="height: fit-content; position: sticky; top: var(--space-xl);">
          <h2 class="font-bold text-lg mb-md">Resumen de Compra</h2>
          
          <div class="flex justify-between mb-sm">
            <span class="text-secondary">Subtotal</span>
            <span>\${{ cartTotal().toFixed(2) }}</span>
          </div>
          <div class="flex justify-between mb-sm">
            <span class="text-secondary">Envío</span>
            <span class="text-success">Gratis</span>
          </div>
          
          <div class="border-t mt-md pt-md flex justify-between items-center mb-lg">
            <span class="font-bold text-lg">Total</span>
            <span class="font-bold text-2xl text-primary">\${{ cartTotal().toFixed(2) }}</span>
          </div>

          <button class="btn btn-primary w-full" style="padding: var(--space-md) 0;" (click)="showPaymentModal = true">
            Proceder al Pago
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Pago Simulado (Pasarela) -->
    <div class="modal-backdrop" *ngIf="showPaymentModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center;">
      <div class="card" style="width: 100%; max-width: 550px; padding: var(--space-2xl); position: relative;">
        <!-- Botón cerrar modal -->
        <button class="btn btn-sm btn-outline" style="position: absolute; top: var(--space-md); right: var(--space-md);" (click)="showPaymentModal = false">✕</button>
        
        <h2 class="font-bold text-3xl mb-xs text-center">Finalizar Compra</h2>
        <p class="text-secondary text-center mb-xl">Total a pagar: <strong class="text-primary text-xl">\${{ cartTotal().toFixed(2) }}</strong></p>

        <!-- Selección de Método de Pago -->
        <div class="mb-lg">
          <label class="form-label mb-sm block">Método de Pago</label>
          <div class="grid grid-3 gap-sm">
            <button class="btn" [ngClass]="paymentMethod === 'tarjeta' ? 'btn-primary' : 'btn-outline'" (click)="paymentMethod = 'tarjeta'" style="padding: 10px;">💳 Tarjeta</button>
            <button class="btn" [ngClass]="paymentMethod === 'qr' ? 'btn-primary' : 'btn-outline'" (click)="paymentMethod = 'qr'" style="padding: 10px;">📱 Código QR</button>
            <button class="btn" [ngClass]="paymentMethod === 'reserva' ? 'btn-primary' : 'btn-outline'" (click)="paymentMethod = 'reserva'" style="padding: 10px;">🛍️ Reserva</button>
          </div>
        </div>

        <!-- Formulario Tarjeta -->
        <div *ngIf="paymentMethod === 'tarjeta'" class="flex-col gap-lg mb-xl animate-fade-in">
          <div>
            <label class="form-label mb-xs block">Número de Tarjeta</label>
            <input type="text" class="form-control p-sm" placeholder="**** **** **** 4242" [(ngModel)]="cardNumber">
          </div>
          <div class="grid grid-2 gap-md">
            <div>
              <label class="form-label mb-xs block">Vencimiento</label>
              <input type="text" class="form-control p-sm" placeholder="MM/YY">
            </div>
            <div>
              <label class="form-label mb-xs block">CVV</label>
              <input type="password" autocomplete="new-password" class="form-control p-sm" placeholder="***">
            </div>
          </div>
        </div>

        <!-- Formulario QR -->
        <div *ngIf="paymentMethod === 'qr'" class="flex-col gap-md mb-xl animate-fade-in text-center">
          <div class="p-lg bg-hover border" style="border-radius: var(--radius-md); display: inline-block; margin: 0 auto;">
            <!-- Simulación de código QR -->
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              <path d="M6 6h1M17 6h1M17 17h1M6 17h1M10 10v4M14 10v4M10 10h4M10 14h4"></path>
            </svg>
          </div>
          <p class="text-secondary text-sm">Escanea este código con tu aplicación bancaria.</p>
        </div>
        
        <!-- Formulario Reserva -->
        <div *ngIf="paymentMethod === 'reserva'" class="flex-col gap-md mb-xl animate-fade-in text-center p-md border rounded" style="background: rgba(108, 99, 255, 0.05); border-color: rgba(108, 99, 255, 0.2);">
          <div style="font-size: 2.5rem; margin-bottom: var(--space-sm);">🛍️</div>
          <h3 class="font-semibold text-lg text-primary">Reserva en Tienda</h3>
          <p class="text-secondary text-sm">Tus productos serán separados. Podrás pagarlos y recogerlos en la sucursal que elijas.</p>
        </div>

        <button class="btn btn-accent w-full" style="padding: var(--space-md) 0;" [disabled]="isProcessing" (click)="processPayment()">
          {{ isProcessing ? 'Procesando pago...' : 'Pagar Ahora' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CartComponent {
  showPaymentModal = false;
  paymentMethod: 'tarjeta' | 'qr' | 'reserva' = 'tarjeta';
  isProcessing = false;
  cardNumber = '4242424242424242'; // Simulador default
  private cartService = inject(CartService);

  // Usamos computed para acceder reactivamente a los datos del CartService
  cartItems = this.cartService.cartItems;
  cartTotal = computed(() => this.cartService.getTotal());

  constructor(
    private apiService: ApiService,
    private toast: ToastService,
    public router: Router
  ) {}

  removeItem(index: number) {
    this.cartService.removeFromCart(index);
  }

  processPayment() {
    this.isProcessing = true;
    
    // Preparar el payload para la API
    const items = this.cartItems().map(item => ({
      variant_id: item.variant?.id ?? 0, // Si no hay variante, enviamos 0 (idealmente habría que prevenir esto agregando variantes default)
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const orderData = {
      items: items,
      order_type: this.paymentMethod === 'reserva' ? 'reserva_pickup' : 'online_delivery',
      payment_method: this.paymentMethod === 'reserva' ? 'efectivo' : this.paymentMethod,
      card_type: this.paymentMethod === 'tarjeta' ? 'Simulada' : null,
      card_last_four: this.paymentMethod === 'tarjeta' ? this.cardNumber.slice(-4) : null,
      transaction_ref: 'TXN-WEB-' + Math.floor(Math.random() * 1000000)
    };

    // Simulamos un delay de red para efecto realista
    setTimeout(() => {
      this.apiService.createOrder(orderData).subscribe({
        next: (res) => {
          this.toast.success('¡Pago completado! Tu orden se generó con éxito.');
          this.cartService.clearCart();
          this.isProcessing = false;
          this.showPaymentModal = false;
          this.router.navigate(['/catalog']); // Redirigir al inicio o página de éxito
        },
        error: (err) => {
          this.toast.error('Ocurrió un error al procesar el pago.');
          console.error(err);
          this.isProcessing = false;
        }
      });
    }, 1500);
  }
}
