import { Component, input } from '@angular/core';
import { addIcons } from 'ionicons';
import { imageOutline, cameraOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';

/**
 * Miniatura de foto de convidado (histórico e reutilizável noutros ecrãs).
 */
@Component({
  selector: 'app-foto-card',
  templateUrl: './foto-card.component.html',
  styleUrls: ['./foto-card.component.scss'],
  imports: [IonIcon],
  standalone: true,
})
export class FotoCardComponent {
  /** Nome exibido na legenda "Nome: …" */
  nome = input.required<string>();
  /** Quem registou a foto (Registro: …) */
  fotografo = input<string>('');
  /** URL da miniatura; vazio mostra o placeholder */
  thumbUrl = input<string>('');

  constructor() {
    addIcons({ imageOutline, cameraOutline });
  }
}
