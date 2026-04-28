import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { IonContent, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { CustomHeaderComponent } from '../../componentes/custom-header/custom-header.component';
import { ExploreContainerComponent } from '../../explore-container/explore-container.component';
import type { EventoOption } from '../fotografar/fotografar.page';

/** Totais mock por evento (API depois). `vetorizado` = valor bruto; `aquarelado` = quantidade para calcular %. */
type TotaisAquarelarMock = { vetorizado: number; aquarelado: number };

@Component({
  selector: 'app-aquarelar',
  templateUrl: 'aquarelar.page.html',
  styleUrls: ['aquarelar.page.scss'],
  imports: [
    IonContent,
    IonSelect,
    IonSelectOption,
    CustomHeaderComponent,
    ExploreContainerComponent,
  ],
})
export class AquarelarPage implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  userName = signal('Usuário');

  eventos: EventoOption[] = [
    { id: '1', titulo: 'Casamento F. & M.' },
    { id: '2', titulo: 'Aniversário 15 anos' },
  ];

  eventoId = signal<string | undefined>(undefined);

  /**
   * Em tablets (≥768px) usa `alert` (centrado); em telemóveis mantém `action-sheet`.
   */
  eventoSelectInterface = signal<'action-sheet' | 'alert'>('action-sheet');
  eventoSelectInterfaceOptions = computed(() => {
    if (this.eventoSelectInterface() === 'alert') {
      return {
        header: 'Selecione o evento' as const,
        cssClass: 'nana-evento-alert',
        mode: 'ios' as const,
      };
    }
    return {
      header: 'Selecione o evento' as const,
      cssClass: 'nana-evento-action-sheet',
    };
  });

  private readonly totaisPorEvento: Record<string, TotaisAquarelarMock> = {
    '1': { vetorizado: 100, aquarelado: 80 },
    '2': { vetorizado: 50, aquarelado: 20 },
  };

  /** Valor bruto de vetorizados (não é percentagem). */
  totalVetorizadoBruto = computed(() => {
    const id = this.eventoId();
    if (id === undefined) {
      return null as number | null;
    }
    return this.totaisPorEvento[id]?.vetorizado ?? 0;
  });

  /** Percentagem de aquarelados em relação ao total bruto de vetorizados do mesmo evento. */
  percentualAquarelado = computed(() => {
    const id = this.eventoId();
    if (id === undefined) {
      return null as string | null;
    }
    const v = this.totaisPorEvento[id]?.vetorizado ?? 0;
    const a = this.totaisPorEvento[id]?.aquarelado ?? 0;
    if (v <= 0) {
      return '0%';
    }
    return `${Math.round((a / v) * 100)}%`;
  });

  private eventoTabletMq?: MediaQueryList;
  private readonly syncEventoSelectInterface = (): void => {
    if (!this.eventoTabletMq) {
      return;
    }
    this.eventoSelectInterface.set(this.eventoTabletMq.matches ? 'alert' : 'action-sheet');
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.eventoTabletMq = window.matchMedia('(min-width: 768px)');
      this.syncEventoSelectInterface();
      this.eventoTabletMq.addEventListener('change', this.syncEventoSelectInterface);
    }
  }

  ngOnDestroy(): void {
    this.eventoTabletMq?.removeEventListener('change', this.syncEventoSelectInterface);
  }

  onEventoChange(event: CustomEvent): void {
    const v = (event.detail as { value?: string | null }).value;
    this.eventoId.set(
      v === null || v === undefined || (typeof v === 'string' && v === '') ? undefined : String(v)
    );
  }
}
