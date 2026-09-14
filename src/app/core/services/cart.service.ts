import { Injectable, signal, computed } from '@angular/core';
import { Product, ProductVariant } from '../models';

export interface CartItem {
  product: Product;
  variant?: ProductVariant; // Opcional, si hay variante seleccionada
  quantity: number;
  unit_price: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'fashionstore_cart';
  
  // Usamos signal para reactividad en Angular 17+
  cartItems = signal<CartItem[]>(this.loadCart());
  
  totalItemsCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

  constructor() {}

  /**
   * Carga el carrito del LocalStorage
   */
  private loadCart(): CartItem[] {
    const saved = localStorage.getItem(this.CART_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Guarda el carrito en LocalStorage
   */
  private saveCart(items: CartItem[]) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    this.cartItems.set(items);
  }

  /**
   * Añade un producto al carrito
   */
  addToCart(product: Product, variant?: ProductVariant, quantity: number = 1) {
    const current = this.cartItems();
    
    // Check if it already exists
    const existingIndex = current.findIndex(item => 
      item.product.id === product.id && 
      (variant ? item.variant?.id === variant.id : true)
    );

    if (existingIndex >= 0) {
      current[existingIndex].quantity += quantity;
    } else {
      current.push({
        product,
        variant,
        quantity,
        unit_price: variant?.price_override ?? product.base_price
      });
    }

    this.saveCart([...current]);
  }

  /**
   * Remueve un producto del carrito
   */
  removeFromCart(index: number) {
    const current = this.cartItems();
    current.splice(index, 1);
    this.saveCart([...current]);
  }

  /**
   * Limpia todo el carrito
   */
  clearCart() {
    this.saveCart([]);
  }

  /**
   * Obtiene el total monetario del carrito
   */
  getTotal(): number {
    return this.cartItems().reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  }
}
