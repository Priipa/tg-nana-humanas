import { Component, signal } from '@angular/core';
import { CustomHeaderComponent } from '../../componentes/custom-header/custom-header.component';
import { ExploreContainerComponent } from '../../explore-container/explore-container.component';
import { IonContent, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import type { EventoOption } from '../fotografar/fotografar.page';

export type SituacaoVetorFiltro = 'pendentes' | 'em-processo' | 'finalizados';

@Component({
  selector: 'app-vetorizar',
  templateUrl: 'vetorizar.html',
  styleUrls: ['vetorizar.scss'],
  imports: [IonContent, IonSelect, IonSelectOption, CustomHeaderComponent, ExploreContainerComponent],
})
export class VetorizarPage {
  eventos: EventoOption[] = [
    { id: '1', titulo: 'Casamento F. & M.' },
    { id: '2', titulo: 'Aniversário 15 anos' },
  ];

  eventoId = signal<string | undefined>(undefined);

  /** Sempre inicia em Pendentes ao trocar de evento; trocar por API consoante o botão. */
  filtroSituacao = signal<SituacaoVetorFiltro>('pendentes');

  /** Totais exibidos nos cards (mock; ligar a API depois) */
  totalRegistros = signal(100);
  totalVetorizado = signal('80%');

  onEventoChange(event: CustomEvent): void {
    const v = (event.detail as { value?: string | null }).value;
    const next =
      v === null || v === undefined || (typeof v === 'string' && v === '') ? undefined : String(v);
    this.eventoId.set(next);
    if (next !== undefined) {
      this.filtroSituacao.set('pendentes');
    }
  }

  selectFiltroSituacao(situacao: SituacaoVetorFiltro): void {
    this.filtroSituacao.set(situacao);
  }

  isFiltroSituacao(situacao: SituacaoVetorFiltro): boolean {
    return this.filtroSituacao() === situacao;
  }

  ariaLabelPainelFiltro(): string {
    switch (this.filtroSituacao()) {
      case 'pendentes':
        return 'Lista de pendentes';
      case 'em-processo':
        return 'Lista em processo';
      case 'finalizados':
        return 'Lista de finalizados';
    }
  }
}
