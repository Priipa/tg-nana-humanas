import { Component, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonInput, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

export type CustomInputType = 'email' | 'password';

@Component({
  selector: 'app-custom-input',
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.scss'],
  standalone: true,
  imports: [FormsModule, IonInput, IonButton, IonIcon],
})
export class CustomInputComponent {
  inputId = input.required<string>();
  label = input.required<string>();
  inputType = input<CustomInputType>('email');
  placeholder = input<string>('');
  autocomplete = input<string>('');
  value = model<string>('');

  showPassword = signal(false);

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
