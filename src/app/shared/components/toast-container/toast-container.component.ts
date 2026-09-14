import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="toastService.remove(toast.id)">
          <span class="toast-dot"></span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast { cursor: pointer; }
    .toast-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .toast-success .toast-dot { background: var(--color-success); }
    .toast-danger  .toast-dot { background: var(--color-danger); }
    .toast-warning .toast-dot { background: var(--color-warning); }
    .toast-info    .toast-dot { background: var(--color-info); }
    .toast-msg { flex: 1; font-size: 0.9rem; }
    .toast-close { color: var(--text-muted); font-size: 0.8rem; }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
