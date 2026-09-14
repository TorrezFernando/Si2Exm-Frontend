import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, Branch, CreateUserByAdmin, Role, Permission } from '../../../core/models';

type ModalMode = 'create' | 'edit' | 'permissions' | null;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="content-area">
      <!-- ── Page Header ─────────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="text-secondary text-sm">
            Gestión de usuarios y asignación de permisos
          </p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <!-- ── Filters ─────────────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="filter-group">
          <input type="text" class="form-control search-input"
            placeholder="Buscar por nombre o email..."
            (input)="searchQuery.set($any($event.target).value)" />
        </div>
        <div class="filter-group">
          <select class="form-select" (change)="filterRole.set(+$any($event.target).value || null)">
            <option [value]="null">Todos los roles</option>
            <option *ngFor="let r of roles()" [value]="r.id">{{ r.name }}</option>
          </select>
        </div>
        <span class="text-muted text-sm">{{ filteredUsers().length }} usuarios</span>
      </div>

      <!-- ── Users Table ─────────────────────────────────────────── -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div> Cargando usuarios...
        </div>
      } @else {
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Sucursal</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers(); track user.id) {
                <tr>
                  <!-- User Info -->
                  <td>
                    <div class="flex items-center gap-sm">
                      <div class="avatar avatar-sm">{{ initials(user) }}</div>
                      <div>
                        <div class="font-medium text-sm">{{ user.full_name || 'Sin nombre' }}</div>
                        <div class="text-xs text-muted">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <!-- Role -->
                  <td>
                    <span class="badge badge-primary">
                      {{ user.role?.name | uppercase }}
                    </span>
                  </td>
                  <!-- Branch -->
                  <td class="text-sm text-secondary">
                    {{ branchName(user.branch_id) }}
                  </td>
                  <!-- Status -->
                  <td>
                    <span class="badge" [ngClass]="user.is_active ? 'badge-success' : 'badge-danger'">
                      {{ user.is_active ? '● Activo' : '○ Inactivo' }}
                    </span>
                  </td>
                  <!-- Date -->
                  <td class="text-sm text-secondary">
                    {{ user.created_at | date:'dd/MM/yyyy' }}
                  </td>
                  <!-- Actions -->
                  <td>
                    <div class="action-btns">
                      <button class="action-btn" title="Permisos Especiales" (click)="openPermissions(user)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </button>
                      <button class="action-btn" title="Editar" (click)="openEdit(user)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      @if (user.is_active) {
                        <button class="action-btn danger" title="Desactivar" (click)="deactivate(user)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        </button>
                      } @else {
                        <button class="action-btn success" title="Activar" (click)="activate(user)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-row">No se encontraron usuarios</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ── Modal: Crear / Editar Usuario ──────────────────────────── -->
    @if (modalMode() === 'create' || modalMode() === 'edit') {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ modalMode() === 'create' ? 'Crear Usuario' : 'Editar Usuario' }}</h3>
            <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="modal-body">
            <div class="grid-2">
              <div class="form-group">
                <label>Nombre completo</label>
                <input type="text" class="form-control" formControlName="full_name" placeholder="Nombre Apellido" />
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
                formControlName="email" placeholder="correo@ejemplo.com"
                [attr.disabled]="modalMode() === 'edit' ? true : null" />
            </div>

            @if (modalMode() === 'create') {
              <div class="form-group">
                <label>Contraseña *</label>
                <input type="password" class="form-control"
                  [class.is-invalid]="isInvalid('password')"
                  formControlName="password" placeholder="Mínimo 6 caracteres" />
              </div>
            }

            <div class="grid-2">
              <div class="form-group">
                <label>Rol *</label>
                <select class="form-select" formControlName="role_id">
                  <option *ngFor="let r of roles()" [value]="r.id">{{ r.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Sucursal</label>
                <select class="form-select" formControlName="branch_id">
                  <option [value]="null">Sin sucursal</option>
                  @for (b of branches(); track b.id) {
                    <option [value]="b.id">{{ b.name }}</option>
                  }
                </select>
              </div>
            </div>

            @if (modalMode() === 'edit') {
              <div class="form-group">
                <label class="toggle-label">
                  <input type="checkbox" formControlName="is_active" />
                  <span>Usuario activo</span>
                </label>
              </div>
            }

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <div class="spinner"></div> }
                {{ modalMode() === 'create' ? 'Crear usuario' : 'Guardar cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ── Modal: Permisos de Usuario ─────────────────────────────────── -->
    @if (modalMode() === 'permissions' && selectedUser()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Permisos Especiales ({{ selectedUser()?.full_name || selectedUser()?.email }})</h3>
            <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <p class="text-sm text-secondary mb-md">
              Aquí puedes añadir permisos extra o quitar permisos asignados por el rol ({{ selectedUser()?.role?.name }}).
            </p>
            
            <div class="grid" style="grid-template-columns: 1fr; gap: 0.5rem;">
              <div *ngFor="let perm of permissions()" class="flex items-center gap-xs">
                <input type="checkbox" 
                       [id]="'uperm_' + perm.id" 
                       [checked]="hasUserPermission(selectedUser()!, perm.id)"
                       [disabled]="selectedUser()?.role?.name === 'admin'"
                       (change)="toggleUserPermission(selectedUser()!.id, perm.id, $event)">
                <label [for]="'uperm_' + perm.id" class="text-sm cursor-pointer" [title]="perm.name">
                  {{ perm.description || perm.name }}
                  <span *ngIf="hasRolePermission(selectedUser()!, perm.id)" class="text-xs text-muted" style="margin-left: 4px;">(Heredado del Rol)</span>
                </label>
              </div>
            </div>
            
            <small class="text-danger block mt-sm" *ngIf="selectedUser()?.role?.name === 'admin'">
              El Administrador tiene todos los permisos por defecto.
            </small>

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-xl); padding-top: var(--space-xl); }
    .page-title { font-size: 1.75rem; font-weight: 800; margin-bottom: 4px; }

    .filter-bar {
      display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap;
      margin-bottom: var(--space-lg);
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); padding: var(--space-md);
    }
    .filter-group { display: flex; align-items: center; }
    .search-input { width: 240px; }

    .loading-state { display: flex; align-items: center; gap: 12px; padding: var(--space-xl); color: var(--text-secondary); background: var(--bg-card); border-radius: var(--radius-lg); }

    .action-btns { display: flex; gap: 4px; }
    .action-btn {
      padding: 6px; border-radius: var(--radius-sm);
      color: var(--text-muted); background: var(--bg-elevated);
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition-fast);
      border: 1px solid transparent;
      &:hover { color: var(--text-primary); border-color: var(--border-default); }
      &.danger:hover { color: var(--color-danger); border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.1); }
      &.success:hover { color: var(--color-success); border-color: rgba(45,212,191,0.3); background: rgba(45,212,191,0.1); }
    }

    .empty-row { text-align: center; padding: var(--space-xl); color: var(--text-muted); }

    /* Modal */
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border-default);
      border-radius: var(--radius-xl); width: 100%; max-width: 560px;
      max-height: 90vh; overflow-y: auto;
      animation: slideUp 300ms ease;
      box-shadow: var(--shadow-lg);
      &.modal-sm { max-width: 420px; }
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-lg); border-bottom: 1px solid var(--border-subtle); }
    .modal-body { padding: var(--space-lg); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-sm); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle); margin-top: var(--space-md); }

    .toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; }
  `]
})
export class UsersComponent implements OnInit {
  loading  = signal(true);
  saving   = signal(false);
  users    = signal<User[]>([]);
  branches = signal<Branch[]>([]);
  roles    = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  
  modalMode    = signal<ModalMode>(null);
  selectedUser = signal<User | null>(null);

  searchQuery  = signal('');
  filterRole   = signal<number | null>(null);

  userForm!: FormGroup;

  filteredUsers = computed(() => {
    let list = this.users();
    const q = this.searchQuery().toLowerCase();
    if (q) list = list.filter(u => u.email.includes(q) || (u.full_name ?? '').toLowerCase().includes(q));
    if (this.filterRole()) list = list.filter(u => u.role_id === this.filterRole());
    return list;
  });

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    this.api.get('/roles/permissions').subscribe(p => this.permissions.set(p as Permission[]));
    this.api.get('/roles').subscribe(r => this.roles.set(r as Role[]));
    this.api.getBranches().subscribe(b => this.branches.set(b));
    
    this.api.getUsers({ limit: 200 }).subscribe({
      next: (users) => { this.users.set(users); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    const clienteRole = this.roles().find(r => r.name === 'cliente');
    
    this.userForm = this.fb.group({
      full_name: [''],
      phone:     [''],
      email:     ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(6)]],
      role_id:   [clienteRole?.id, Validators.required],
      branch_id: [null],
      is_active: [true]
    });
    this.selectedUser.set(null);
    this.modalMode.set('create');
  }

  openEdit(user: User): void {
    this.userForm = this.fb.group({
      full_name: [user.full_name || ''],
      phone:     [user.phone || ''],
      email:     [{ value: user.email, disabled: true }],
      password:  [''],
      role_id:   [user.role_id, Validators.required],
      branch_id: [user.branch_id || null],
      is_active: [user.is_active]
    });
    this.selectedUser.set(user);
    this.modalMode.set('edit');
  }
  
  openPermissions(user: User): void {
    this.selectedUser.set(user);
    this.modalMode.set('permissions');
  }

  closeModal(): void { this.modalMode.set(null); this.selectedUser.set(null); }

  isInvalid(f: string): boolean {
    const c = this.userForm?.get(f);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  saveUser(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.userForm.getRawValue();

    if (this.modalMode() === 'create') {
      const payload: CreateUserByAdmin = {
        email: v.email, full_name: v.full_name, phone: v.phone,
        password: v.password, role_id: Number(v.role_id),
        branch_id: v.branch_id ? Number(v.branch_id) : undefined
      };
      
      this.api.post('/users', payload).subscribe({
        next: (u: any) => {
          this.users.update(list => [u, ...list]);
          this.toast.success(`Usuario "${u.email}" creado`);
          this.saving.set(false); this.closeModal();
        },
        error: (e) => { this.toast.error(this.toast.extractError(e)); this.saving.set(false); }
      });
    } else {
      const user = this.selectedUser()!;
      this.api.patch(`/users/${user.id}`, {
        full_name: v.full_name, phone: v.phone,
        role_id: Number(v.role_id), branch_id: v.branch_id ? Number(v.branch_id) : undefined, is_active: v.is_active
      }).subscribe({
        next: (u: any) => {
          this.users.update(list => list.map(x => x.id === u.id ? u : x));
          this.toast.success('Usuario actualizado correctamente');
          this.saving.set(false); this.closeModal();
        },
        error: (e) => { this.toast.error(this.toast.extractError(e)); this.saving.set(false); }
      });
    }
  }

  deactivate(user: User): void {
    if (!confirm(`¿Desactivar a "${user.email}"?`)) return;
    this.api.delete(`/users/${user.id}`).subscribe({
      next: (u: any) => {
        this.users.update(list => list.map(x => x.id === u.id ? u : x));
        this.toast.warning(`"${u.email}" desactivado`);
      },
      error: (e) => this.toast.error(this.toast.extractError(e))
    });
  }

  activate(user: User): void {
    this.api.patch(`/users/${user.id}`, {is_active: true}).subscribe({
      next: (u: any) => {
        this.users.update(list => list.map(x => x.id === u.id ? u : x));
        this.toast.success(`"${u.email}" reactivado`);
      },
      error: (e) => this.toast.error(this.toast.extractError(e))
    });
  }

  branchName(id?: number): string {
    if (!id) return '—';
    return this.branches().find(b => b.id === id)?.name ?? '—';
  }

  initials(user: User): string {
    return (user.full_name || user.email).slice(0, 2).toUpperCase();
  }
  
  hasRolePermission(user: User, permId: number): boolean {
    return user.role?.permissions?.some(p => p.id === permId) || false;
  }
  
  hasUserPermission(user: User, permId: number): boolean {
    const roleHasIt = this.hasRolePermission(user, permId);
    
    // Check overrides
    const override = user.user_permissions?.find(up => up.permission.id === permId);
    if (override) {
      return override.is_granted;
    }
    
    return roleHasIt;
  }
  
  toggleUserPermission(userId: number, permId: number, event: Event) {
    const isGranted = (event.target as HTMLInputElement).checked;
    
    this.api.post(`/users/${userId}/permissions?permission_id=${permId}&is_granted=${isGranted}`, {}).subscribe({
      next: () => {
        this.toast.success('Permiso actualizado');
        // Reload users to get updated permissions
        this.loadData();
      },
      error: (e) => this.toast.error(this.toast.extractError(e))
    });
  }
}
