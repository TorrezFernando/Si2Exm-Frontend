import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from './features/chat/chat.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatComponent, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-chat></app-chat>
    <app-toast-container />
  `
})
export class AppComponent {}
