import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const toast: Toast = { id: this.nextId++, message, type };
    this._toasts.update(t => [...t, toast]);
    setTimeout(() => this.remove(toast.id), duration);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'danger'); }
  warning(msg: string) { this.show(msg, 'warning'); }
  info(msg: string)    { this.show(msg, 'info'); }

  remove(id: number): void {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }

  extractError(err: any): string {
    const detail = err?.error?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(', ');
    return 'Ocurrió un error inesperado';
  }
}
