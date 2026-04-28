import { Component, inject, Input } from '@angular/core';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline, downloadOutline } from 'ionicons/icons';

/** Espelha FinalizadoVetorItem (evita import circular). */
export type ItemMenuFinalizado = {
  id: string;
  nome: string;
  fotografo: string;
  vetorizadoPor: string;
  thumbOriginalUrl: string;
  thumbVetorUrl: string;
  vetorMime: string;
  vetorNomeArquivo: string;
  eventoId: string;
};

@Component({
  selector: 'app-vetorizar-finalizado-menu',
  standalone: true,
  imports: [IonContent, IonList, IonItem, IonLabel, IonIcon],
  styles: `
    :host {
      display: block;
      width: max-content;
      max-width: 100%;
      box-sizing: border-box;
      color-scheme: only light;
    }
    ion-content.vetor-fin-menu-popover {
      --background: #ffffff;
      --color: #2c3138;
      color-scheme: only light;
      --overflow: hidden;
      --padding-start: 8px;
      --padding-end: 8px;
      --padding-top: 6px;
      --padding-bottom: 6px;
    }
    ion-content.vetor-fin-menu-popover::part(scroll) {
      overflow: hidden;
    }
    ion-list {
      width: max-content;
      max-width: 100%;
      margin: 0;
      padding: 0;
      background: transparent;
    }
    ion-item.vetor-fin-menu-popover__item {
      --inner-padding-end: 0;
      --padding-start: 6px;
      --min-height: 44px;
      width: max-content;
      max-width: calc(100vw - 32px);
      --background: transparent;
      --background-activated: rgba(193, 82, 97, 0.1);
      --color: #2c3138;
      --border-color: transparent;
      font-size: clamp(0.9rem, 2.4vw, 1rem);
      font-weight: 400;
    }
    ion-label {
      flex: 0 1 auto;
      color: #2c3138;
      white-space: nowrap;
      font-size: inherit;
      font-weight: inherit;
    }
    .vetor-fin-menu-popover__ico {
      color: #c15261;
      font-size: 1.35rem;
      width: 1.35rem;
      height: 1.35rem;
      margin-inline-end: 10px;
    }
  `,
  template: `
    <ion-content class="vetor-fin-menu-popover" [scrollY]="false">
      <ion-list lines="none">
        <ion-item button detail="false" (click)="baixarVetor()" class="vetor-fin-menu-popover__item">
          <ion-icon slot="start" name="download-outline" class="vetor-fin-menu-popover__ico" aria-hidden="true" />
          <ion-label>Baixar vetorização</ion-label>
        </ion-item>
        <ion-item button detail="false" (click)="baixarOriginal()" class="vetor-fin-menu-popover__item">
          <ion-icon slot="start" name="download-outline" class="vetor-fin-menu-popover__ico" aria-hidden="true" />
          <ion-label>Baixar original</ion-label>
        </ion-item>
        <ion-item button detail="false" (click)="marcarEmProcesso()" class="vetor-fin-menu-popover__item">
          <ion-icon
            slot="start"
            name="close-circle-outline"
            class="vetor-fin-menu-popover__ico"
            aria-hidden="true"
          />
          <ion-label>Marcar como 'em processo'</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class VetorizarFinalizadoMenuComponent {
  @Input({ required: true }) item!: ItemMenuFinalizado;

  private readonly popoverCtrl = inject(PopoverController);

  constructor() {
    addIcons({ downloadOutline, closeCircleOutline });
  }

  baixarVetor(): void {
    void this.popoverCtrl.dismiss(this.item, 'baixar');
  }

  baixarOriginal(): void {
    void this.popoverCtrl.dismiss(this.item, 'baixar-original');
  }

  marcarEmProcesso(): void {
    void this.popoverCtrl.dismiss(this.item, 'em-processo');
  }
}
