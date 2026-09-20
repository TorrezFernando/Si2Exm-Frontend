import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Message {
  role: 'user' | 'model';
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="authService.isLoggedIn()" class="chat-widget" [class.open]="isOpen()">
      <!-- Toggle Button -->
      <button class="chat-toggle btn btn-primary" (click)="toggleChat()">
        <span *ngIf="!isOpen()">💬 Asistente IA</span>
        <span *ngIf="isOpen()">✕ Cerrar</span>
      </button>

      <!-- Chat Window -->
      <div class="chat-window card card-glass" *ngIf="isOpen()">
        <div class="chat-header">
          <h3 class="font-bold">✨ Personal Shopper</h3>
          <p class="text-xs text-secondary">Gemini IA</p>
        </div>

        <div class="chat-messages" #scrollContainer>
          <div *ngFor="let msg of messages()" 
               class="message" 
               [ngClass]="msg.role === 'user' ? 'msg-user' : 'msg-ai'">
            {{ msg.content }}
          </div>
          <div *ngIf="loading()" class="message msg-ai typing-indicator">
            Generando respuesta...
          </div>
        </div>

        <div class="chat-input-area border-t p-sm">
          <input type="text" 
                 class="form-input" 
                 placeholder="Pregúntame sobre moda..." 
                 [(ngModel)]="userInput" 
                 (keyup.enter)="sendMessage()">
          <button class="btn btn-primary btn-sm ml-sm" (click)="sendMessage()" [disabled]="loading() || !userInput.trim()">
            Enviar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .chat-toggle {
      border-radius: 30px;
      padding: 12px 20px;
      box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
      transition: all 0.3s ease;
    }
    .chat-window {
      width: 350px;
      height: 450px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .chat-header {
      padding: 16px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: white;
    }
    .chat-header h3, .chat-header p { margin: 0; color: white; }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message {
      padding: 10px 14px;
      border-radius: 12px;
      max-width: 85%;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .msg-user {
      background: var(--bg-hover);
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .msg-ai {
      background: rgba(108, 99, 255, 0.1);
      border: 1px solid rgba(108, 99, 255, 0.2);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .typing-indicator { font-style: italic; opacity: 0.7; }
    .chat-input-area {
      display: flex;
      background: var(--bg-card);
    }
    .chat-input-area input { flex: 1; border-radius: 20px; }
  `]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal(false);
  loading = signal(false);
  userInput = '';
  
  messages = signal<Message[]>([
    { role: 'model', content: '¡Hola! Soy tu Personal Shopper. ¿En qué te puedo ayudar hoy?' }
  ]);

  constructor(
    private api: ApiService,
    public authService: AuthService
  ) {}

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  sendMessage() {
    if (!this.userInput.trim() || this.loading()) return;
    
    const userText = this.userInput.trim();
    this.userInput = '';
    
    // Añadir mensaje del usuario
    const newMsgs = [...this.messages(), { role: 'user' as const, content: userText }];
    this.messages.set(newMsgs);
    
    this.loading.set(true);
    
    // Llamar a la API
    this.api.chatWithAI(newMsgs).subscribe({
      next: (res) => {
        this.messages.set([...newMsgs, { role: 'model', content: res.response }]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.set([...newMsgs, { role: 'model', content: 'Lo siento, tuve un problema al procesar tu solicitud.' }]);
        this.loading.set(false);
      }
    });
  }
}
