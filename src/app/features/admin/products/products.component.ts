import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  
  showModal = false;
  isEditing = false;
  loading = false;
  editingId: number | null = null;
  
  productForm: FormGroup;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      base_price: [0, [Validators.required, Validators.min(0)]],
      season: [''],
      image_url: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.api.getProducts().subscribe({
      next: (res: Product[]) => this.products = res,
      error: (err: any) => this.toast.error('Error al cargar productos')
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.productForm.reset({ base_price: 0 });
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.isEditing = true;
    this.editingId = product.id;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      base_price: product.base_price,
      season: product.season,
      image_url: product.image_url
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.productForm.invalid) return;
    this.loading = true;
    
    const data = this.productForm.value;
    
    if (this.isEditing && this.editingId) {
      this.api.updateProduct(this.editingId, data).subscribe({
        next: (res: Product) => {
          this.toast.success('Producto actualizado exitosamente');
          this.loadProducts();
          this.closeModal();
          this.loading = false;
        },
        error: (err: any) => {
          this.toast.error('Error al actualizar');
          this.loading = false;
        }
      });
    } else {
      this.api.createProduct(data).subscribe({
        next: (res: Product) => {
          this.toast.success('Producto creado exitosamente');
          this.loadProducts();
          this.closeModal();
          this.loading = false;
        },
        error: (err: any) => {
          this.toast.error('Error al crear producto');
          this.loading = false;
        }
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.api.deleteProduct(id).subscribe({
        next: (res: Product) => {
          this.toast.success('Producto eliminado');
          this.loadProducts();
        },
        error: (err: any) => this.toast.error('Error al eliminar producto')
      });
    }
  }
}


