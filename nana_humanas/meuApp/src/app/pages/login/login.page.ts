import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { CustomInputComponent } from '../../componentes/custom-input/custom-input.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, IonButton, CustomInputComponent],
})
export class LoginPage {
  private readonly router = inject(Router);

  email = '';
  password = '';

  onLogin(): void {
    this.router.navigateByUrl('/tabs/fotografar');
  }
}
