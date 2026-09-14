import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastContainerComponent],
  template: `
    <app-toast-container />

    <div class="auth-page register-page">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="logo-icon">F</span>
            <span class="logo-text">FashionStore</span>
          </div>
          <h1 class="brand-headline">Únete a<br>la moda digital</h1>
          <p class="brand-sub">Crea tu cuenta y descubre un catálogo exclusivo con reservas instantáneas y experiencias de compra únicas.</p>
          <div class="brand-stats">
            <div class="stat"><span class="stat-num">3</span><span class="stat-label">Sucursales</span></div>
            <div class="stat"><span class="stat-num">500+</span><span class="stat-label">Prendas</span></div>
            <div class="stat"><span class="stat-num">AR</span><span class="stat-label">Vestidor Virtual</span></div>
          </div>
        </div>
        <div class="brand-bg-orb orb-1"></div>
        <div class="brand-bg-orb orb-2"></div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-card">
          @if (!success()) {
            <div class="form-header">
              <h2>Crear cuenta</h2>
              <p class="text-secondary text-sm">Regístrate como cliente</p>
            </div>

            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="form-body">
              <div class="grid-2">
                <div class="form-group">
                  <label>Nombre completo</label>
                  <input type="text" class="form-control" formControlName="full_name" placeholder="Juan Pérez" />
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" class="form-control" formControlName="phone" placeholder="+591 7XXXXXXX" />
                </div>
              </div>

              <div class="form-group">
                <label>Correo electrónico *</label>
                <input type="email" class="form-control"
                  [class.is-invalid]="isInvalid('email')"
                  formControlName="email" placeholder="tu@email.com" />
                @if (isInvalid('email')) {
                  <span class="form-error">Correo inválido</span>
                }
              </div>

              <div class="form-group">
                <label>Contraseña *</label>
                <input [type]="showPwd() ? 'text' : 'password'" class="form-control"
                  [class.is-invalid]="isInvalid('password')"
                  formControlName="password" placeholder="Mín. 6 caracteres" />
                @if (isInvalid('password')) {
                  <span class="form-error">Mínimo 6 caracteres</span>
                }
              </div>

              <div class="form-group">
                <label>Confirmar contraseña *</label>
                <input [type]="showPwd() ? 'text' : 'password'" class="form-control"
                  [class.is-invalid]="isInvalid('confirmPassword') || passwordMismatch()"
                  formControlName="confirmPassword" placeholder="Repite la contraseña" />
                @if (passwordMismatch()) {
                  <span class="form-error">Las contraseñas no coinciden</span>
                }
              </div>

              <div class="terms-row">
                <input type="checkbox" id="terms" formControlName="terms" />
                <label for="terms" class="text-sm text-secondary">
                  Acepto los <a href="#">términos y condiciones</a>
                </label>
              </div>

              <button type="submit" class="btn btn-primary btn-full mt-md"
                [disabled]="registerForm.invalid || loading()">
                @if (loading()) {
                  <div class="spinner"></div> Creando cuenta...
                } @else {
                  Crear mi cuenta
                }
              </button>

              <div class="form-divider"><span>¿Ya tienes cuenta?</span></div>
              <a routerLink="/auth/login" class="btn btn-outline btn-full">Iniciar sesión</a>
            </form>
          } @else {
            <!-- Success state -->
            <div class="success-state">
              <div class="success-icon">✓</div>
              <h2>¡Cuenta creada!</h2>
              <p class="text-secondary">Tu cuenta ha sido creada exitosamente.</p>
              <a routerLink="/auth/login" class="btn btn-primary btn-full mt-lg">Iniciar sesión</a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; }
    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 48px; position: relative; overflow: hidden;
      @media (max-width: 768px) { display: none; }
    }
    .brand-content { position: relative; z-index: 1; max-width: 440px; }
    .brand-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
    .logo-icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: white;
    }
    .logo-text { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; }
    .brand-headline {
      font-size: 3rem; font-weight: 800; line-height: 1.1;
      background: linear-gradient(135deg, #fff, var(--color-primary-light), var(--color-accent));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 16px;
    }
    .brand-sub { color: var(--text-secondary); line-height: 1.7; margin-bottom: 40px; }
    .brand-stats {
      display: flex; gap: 32px;
      .stat { display: flex; flex-direction: column; gap: 2px; }
      .stat-num { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--color-primary-light); }
      .stat-label { font-size: 0.8rem; color: var(--text-muted); }
    }
    .brand-bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); }
    .orb-1 { width: 350px; height: 350px; background: rgba(108,99,255,0.12); top: -80px; right: -80px; }
    .orb-2 { width: 250px; height: 250px; background: rgba(255,101,132,0.08); bottom: -40px; left: -40px; }

    .auth-form-panel {
      width: 520px; background: var(--bg-surface);
      display: flex; align-items: center; justify-content: center; padding: 32px;
      @media (max-width: 768px) { width: 100%; background: var(--bg-base); }
    }
    .auth-form-card { width: 100%; max-width: 420px; animation: slideUp 400ms ease; }
    .form-header { text-align: center; margin-bottom: 28px;
      h2 { font-size: 1.75rem; font-weight: 800; margin-bottom: 6px; }
    }
    .terms-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .form-divider {
      display: flex; align-items: center; gap: 12px; margin: 16px 0;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--border-subtle); }
      span { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }
    }
    .success-state { text-align: center; padding: 32px 0;
      .success-icon {
        width: 72px; height: 72px; border-radius: 50%;
        background: linear-gradient(135deg, var(--color-success), #1a9980);
        display: flex; align-items: center; justify-content: center;
        font-size: 2rem; color: white; margin: 0 auto 24px; box-shadow: 0 0 30px rgba(45,212,191,0.4);
      }
      h2 { margin-bottom: 8px; }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  success = signal(false);
  showPwd = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.registerForm = this.fb.group({
      full_name:       [''],
      phone:           [''],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      terms:           [false, Validators.requiredTrue]
    });
  }

  isInvalid(f: string): boolean {
    const c = this.registerForm.get(f);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  passwordMismatch(): boolean {
    const { password, confirmPassword } = this.registerForm.value;
    return !!(confirmPassword && password !== confirmPassword);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.passwordMismatch()) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { full_name, phone, email, password } = this.registerForm.value;

    this.auth.register({ full_name, phone, email, password }).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(this.toast.extractError(err));
      }
    });
  }
}
