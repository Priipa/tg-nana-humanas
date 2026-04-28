import { Component, input, output } from '@angular/core';
import { IonContent, IonIcon, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

@Component({
  selector: 'app-visualizador-foto',
  standalone: true,
  templateUrl: './visualizador-foto.component.html',
  styleUrls: ['./visualizador-foto.component.scss'],
  imports: [IonModal, IonContent, IonIcon],
})
export class VisualizadorFotoComponent {
  /** Controlado pelo ascendente (signal → binding). */
  aberto = input(false);
  src = input('');
  alt = input('');
  fechar = output<void>();

  constructor() {
    addIcons({ close });
  }

  onDismiss(): void {
    this.fechar.emit();
  }

  fecharPorBotao(): void {
    this.fechar.emit();
  }
}
