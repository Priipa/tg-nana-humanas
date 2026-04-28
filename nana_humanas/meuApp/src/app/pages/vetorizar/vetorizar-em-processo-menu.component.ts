import { Component, inject, Input } from '@angular/core';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline, downloadOutline } from 'ionicons/icons';

/** Mesma forma que EmProcessoVetorItem (evita import circular com vetorizar.ts). */
export type ItemMenuEmProcesso = {
  id: string;
  eventoId: string;
  nome: string;
  fotografo: string;
  thumbUrl: string;
  inicializadoPor: string;
  vetorAnexado: unknown;
};

@Component({
  selector: 'app-vetorizar-em-processo-menu',
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
    ion-content.vetor-ep-menu-popover {
      --background: #ffffff;
      --color: #2c3138;
      color-scheme: only light;
      --overflow: hidden;
      --padding-start: 14px;
      --padding-end: 14px;
      --padding-top: 10px;
      --padding-bottom: 10px;
    }
    ion-content.vetor-ep-menu-popover::part(scroll) {
      overflow-y: hidden;
      overflow-x: hidden;
    }
    ion-list {
      width: max-content;
      max-width: 100%;
      background: transparent;
      margin: 0;
      padding: 0;
    }
    ion-item.vetor-ep-menu-popover__item {
      --inner-padding-end: 0;
      --inner-border-width: 0;
      width: max-content;
      max-width: 100%;
      --background: transparent;
      --background-activated: rgba(193, 82, 97, 0.1);
      --background-focused: rgba(193, 82, 97, 0.06);
      --color: #2c3138;
      --border-color: transparent;
      --min-height: 44px;
      --padding-start: 0;
      font-size: clamp(0.9rem, 2.4vw, 1rem);
    }
    ion-label {
      flex: 0 1 auto;
      color: #2c3138;
      white-space: nowrap;
    }
    .vetor-ep-menu-popover__ico {
      color: #c15261;
      font-size: 1.35rem;
      margin-inline-end: 10px;
    }
  `,
  template: `
    <ion-content class="vetor-ep-menu-popover" [scrollY]="false">
      <ion-list lines="none">
        <ion-item button detail="false" (click)="downloadFoto()" class="vetor-ep-menu-popover__item">
          <ion-icon slot="start" name="download-outline" class="vetor-ep-menu-popover__ico" aria-hidden="true" />
          <ion-label>Download da foto</ion-label>
        </ion-item>
        <ion-item button detail="false" (click)="confirmar()" class="vetor-ep-menu-popover__item">
          <ion-icon
            slot="start"
            name="close-circle-outline"
            class="vetor-ep-menu-popover__ico"
            aria-hidden="true"
          />
          <ion-label>Marcar como não iniciado</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class VetorizarEmProcessoMenuComponent {
  /** Ionic popover passa `componentProps` como @Input (não como signal input). */
  @Input({ required: true }) item!: ItemMenuEmProcesso;

  private readonly popoverCtrl = inject(PopoverController);

  constructor() {
    addIcons({ closeCircleOutline, downloadOutline });
  }

  downloadFoto(): void {
    void this.popoverCtrl.dismiss(this.item, 'baixar-foto');
  }

  confirmar(): void {
    void this.popoverCtrl.dismiss(this.item, 'confirm');
  }
}
