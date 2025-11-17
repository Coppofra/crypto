import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `<router-outlet />`,
  styles: [`
    :host {
      display: block;
      margin: 0;
      padding: 0;
    }
  `]
})
export class App {
  protected readonly title = signal('crypto');
}
