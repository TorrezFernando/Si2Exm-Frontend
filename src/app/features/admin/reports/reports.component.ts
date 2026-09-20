import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ReportSale {
  id: number;
  date: string;
  total_amount: number;
  order_type: string;
  payment_method: string;
  branch: string;
  customer_email: string;
}

interface ReportResponse {
  total_revenue: number;
  count: number;
  data: ReportSale[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);

  startDate: string = '';
  endDate: string = '';
  orderType: string = '';
  paymentMethod: string = '';

  sales: ReportSale[] = [];
  totalRevenue: number = 0;
  totalCount: number = 0;
  loading: boolean = false;
  error: string = '';

  // AI Chat properties
  chatOpen: boolean = false;
  chatMessage: string = '';
  chatHistory: { role: 'user'|'ai', content: string }[] = [];
  chatLoading: boolean = false;

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.loading = true;
    this.error = '';

    let params = new URLSearchParams();
    if (this.startDate) params.append('start_date', this.startDate);
    if (this.endDate) params.append('end_date', this.endDate);
    if (this.orderType) params.append('order_type', this.orderType);
    if (this.paymentMethod) params.append('payment_method', this.paymentMethod);

    const url = `${environment.apiUrl}/reports/sales?${params.toString()}`;
    
    this.http.get<ReportResponse>(url).subscribe({
      next: (res) => {
        this.sales = res.data;
        this.totalRevenue = res.total_revenue;
        this.totalCount = res.count;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar el reporte. Verifica tus permisos.';
        this.loading = false;
      }
    });
  }

  download(format: 'pdf' | 'excel') {
    let params = new URLSearchParams();
    params.append('format', format);
    if (this.startDate) params.append('start_date', this.startDate);
    if (this.endDate) params.append('end_date', this.endDate);
    if (this.orderType) params.append('order_type', this.orderType);
    if (this.paymentMethod) params.append('payment_method', this.paymentMethod);

    const url = `${environment.apiUrl}/reports/sales/export?${params.toString()}`;
    
    // Para descargar archivos en Angular desde una API protegida, necesitamos manejar el blob
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `reporte_ventas.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al descargar el reporte');
      }
    });
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;
  }

  sendChatMessage() {
    if (!this.chatMessage.trim() || this.chatLoading) return;
    
    const userText = this.chatMessage;
    this.chatHistory.push({ role: 'user', content: userText });
    this.chatMessage = '';
    this.chatLoading = true;

    const url = `${environment.apiUrl}/reports/ai-chat`;
    const body = {
      message: userText,
      sales_data: this.sales
    };

    this.http.post<{response: string}>(url, body).subscribe({
      next: (res) => {
        this.chatHistory.push({ role: 'ai', content: res.response });
        this.chatLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.chatHistory.push({ role: 'ai', content: 'Lo siento, ocurrió un error al analizar los datos.' });
        this.chatLoading = false;
      }
    });
  }
}
