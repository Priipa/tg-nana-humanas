import { isPlatformBrowser } from '@angular/common';
import { Camera, CameraDirection, type MediaResult, MediaType } from '@capacitor/camera';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Capacitor } from '@capacitor/core';
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActionSheetController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fromEvent } from 'rxjs';
import { close, cameraOutline, imagesOutline, searchOutline } from 'ionicons/icons';
import { CustomHeaderComponent } from '../../componentes/custom-header/custom-header.component';
import { FotoCardComponent } from '../../componentes/foto-card/foto-card.component';
import { VisualizadorFotoComponent } from '../../componentes/visualizador-foto/visualizador-foto.component';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

export type EventoOption = { id: string; titulo: string };

export type EnvioHistorico = {
  id: string;
  /** Alinhado ao `eventoId` do `ion-select` */
  eventoId: string;
  nome: string;
  thumbUrl: string;
  /** Nome de quem registou / tirou a foto */
  fotografo: string;
};

/**
 * Mocks em `assets/fotos-mock` — ficheiros `{número}photo` (X = qualquer algarismo, ex. `1photo`, `2photo.jpeg`).
 * Não usar `*aquarela*`, `*vetor*`, etc.
 */
const FOTOS_MOCK_PHOTO = [
  'assets/fotos-mock/1photo.jpeg',
  'assets/fotos-mock/2photo.jpeg',
  'assets/fotos-mock/3photo.jpeg',
] as const;

@Component({
  selector: 'app-fotografar',
  templateUrl: 'fotografar.page.html',
  styleUrls: ['fotografar.page.scss'],
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    CustomHeaderComponent,
    FotoCardComponent,
    VisualizadorFotoComponent,
  ],
})
export class FotografarPage implements OnDestroy {
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly toastController = inject(ToastController);
  private readonly platformId = inject(PLATFORM_ID);

  /** O `#cameraInput` no template é exposto como `ElementRef` — usar `.nativeElement` para `.click()`. */
  private readonly cameraInput = viewChild.required<ElementRef<HTMLInputElement>>('cameraInput');

  userName = signal('Usuário');

  eventos: EventoOption[] = [
    { id: '1', titulo: 'Casamento F. & M.' },
    { id: '2', titulo: 'Aniversário 15 anos' },
  ];

  eventoId = signal<string | undefined>(undefined);

  /**
   * Em tablets (≥768px) usa `alert` (centrado); em telemóveis mantém `action-sheet` (base).
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

  private eventoTabletMq?: MediaQueryList;
  private readonly syncEventoSelectInterface = (): void => {
    if (!this.eventoTabletMq) {
      return;
    }
    this.eventoSelectInterface.set(this.eventoTabletMq.matches ? 'alert' : 'action-sheet');
  };

  guestName = signal('');
  searchQuery = signal('');

  previewUrl = signal<string | null>(null);
  private previewRevokable: string | null = null;

  visualizadorFotoAberto = signal(false);
  visualizadorFotoSrc = signal('');
  visualizadorFotoAlt = signal('');

  private nextEnvioId = 3;

  /** Número de colunas de `.envios-grid` (igual a `fotografar.page.scss`: <600=2, 600–899=3, 900+=4). */
  private readonly historicoColunas = signal(2);

  /** Fileiras mostradas no histórico: início 2; cada "Ver mais" +2. */
  private readonly fileirasExibidasHistorico = signal(2);

  historico = signal<EnvioHistorico[]>([
    {
      id: 'h-1',
      eventoId: '1',
      nome: 'Fernando Henrique Nascimento',
      thumbUrl: FOTOS_MOCK_PHOTO[0],
      fotografo: 'Giovanna',
    },
    {
      id: 'h-2',
      eventoId: '1',
      nome: 'Mariana Ayres',
      thumbUrl: FOTOS_MOCK_PHOTO[1],
      fotografo: 'Giovanna Nascimento',
    },
    {
      id: 'h-3',
      eventoId: '2',
      nome: 'Convidado A',
      thumbUrl: FOTOS_MOCK_PHOTO[2],
      fotografo: 'Giovanna',
    },
  ]);

  /** Envios só do evento escolhido no select. */
  historicoDoEvento = computed(() => {
    const e = this.eventoId();
    if (e === undefined) {
      return [] as EnvioHistorico[];
    }
    return this.historico().filter((h) => h.eventoId === e);
  });

  /** Número de fotos do evento atual (para o título). */
  totalEnvios = computed(() => this.historicoDoEvento().length);

  historicoFiltrado = computed(() => {
    const base = this.historicoDoEvento();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return base;
    }
    return base.filter(
      (h) => h.nome.toLowerCase().includes(q) || h.fotografo.toLowerCase().includes(q)
    );
  });

  private readonly limiteItensHistorico = computed(
    () => this.historicoColunas() * this.fileirasExibidasHistorico()
  );

  /** Lista já cortada às fileiras visíveis (2 iniciais; +2 fileiras por "Ver mais"). */
  historicoExibido = computed(() => {
    return this.historicoFiltrado().slice(0, this.limiteItensHistorico());
  });

  mostrarVerMaisHistorico = computed(
    () => this.historicoFiltrado().length > this.historicoExibido().length
  );

  podeEnviar = computed(
    () =>
      this.eventoId() !== undefined &&
      this.guestName().trim().length > 0 &&
      this.previewUrl() !== null
  );

  constructor() {
    addIcons({ close, cameraOutline, imagesOutline, searchOutline });

    if (isPlatformBrowser(this.platformId)) {
      this.eventoTabletMq = window.matchMedia('(min-width: 768px)');
      this.syncEventoSelectInterface();
      this.eventoTabletMq.addEventListener('change', this.syncEventoSelectInterface);

      this.updateHistoricoColunasParaLargura();
      fromEvent(window, 'resize', { passive: true })
        .pipe(takeUntilDestroyed())
        .subscribe(() => this.updateHistoricoColunasParaLargura());
    }
  }

  private updateHistoricoColunasParaLargura(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const w = window.innerWidth;
    const c = w >= 900 ? 4 : w >= 600 ? 3 : 2;
    this.historicoColunas.set(c);
  }

  onEventoChange(event: CustomEvent): void {
    const v = (event.detail as { value?: string | null }).value;
    this.eventoId.set(
      v === null || v === undefined || (typeof v === 'string' && v === '') ? undefined : String(v)
    );
    this.fileirasExibidasHistorico.set(2);
  }

  onGuestInput(event: Event): void {
    const e = event as CustomEvent<{ value?: string | null }>;
    this.guestName.set(e.detail.value ?? '');
  }

  onSearchInput(event: Event): void {
    const e = event as CustomEvent<{ value?: string | null }>;
    this.searchQuery.set(e.detail.value ?? '');
    this.fileirasExibidasHistorico.set(2);
  }

  verMaisHistorico(): void {
    this.fileirasExibidasHistorico.update((f) => f + 2);
  }

  private liberarPrevia(): void {
    if (this.previewRevokable) {
      URL.revokeObjectURL(this.previewRevokable);
      this.previewRevokable = null;
    }
  }

  onFotoTrocada(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    target.value = '';
    this.liberarPrevia();
    if (!file) {
      this.previewUrl.set(null);
      return;
    }
    const url = URL.createObjectURL(file);
    this.previewRevokable = url;
    this.previewUrl.set(url);
  }

  /** PWA / browser: input com `capture`. iOS / Android: câmara nativa. */
  private abrirFileInputCamera(): void {
    this.cameraInput().nativeElement.click();
  }

  private async abrirCameraNativaSeDisponivel(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.abrirFileInputCamera();
      return;
    }
    try {
      const perm = await Camera.requestPermissions({ permissions: ['camera'] });
      if (perm.camera === 'denied') {
        await this.exibirToast('Ative a permissão de câmara nas definições para tirar fotos.', false);
        return;
      }
    } catch {
      /* continua: takePhoto pode ainda abrir o fluxo de permissão */
    }

    try {
      const result = await Camera.takePhoto({
        quality: 85,
        correctOrientation: true,
        saveToGallery: false,
        cameraDirection: CameraDirection.Rear,
      });
      if (result.type !== MediaType.Photo) {
        return;
      }
      this.liberarPrevia();
      const url = this.construirUrlDePreviewDeCamera(result);
      if (url) {
        if (url.startsWith('blob:')) {
          this.previewRevokable = url;
        }
        this.previewUrl.set(url);
      } else {
        this.previewUrl.set(null);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const m = msg.toLowerCase();
      if (m.includes('cancel') || m.includes('dismissed') || m.includes('canceled') || m.includes('cancelled')) {
        return;
      }
      await this.exibirToast('Não foi possível usar a câmara. Tente outra vez ou use a galeria.', false);
    }
  }

  private construirUrlDePreviewDeCamera(result: MediaResult): string | null {
    if (result.webPath) {
      return result.webPath;
    }
    if (result.uri) {
      return Capacitor.convertFileSrc(result.uri);
    }
    if (result.thumbnail) {
      return `data:image/jpeg;base64,${result.thumbnail}`;
    }
    return null;
  }

  private async selecionarDaGaleriaComFilePicker(): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'android') {
        await FilePicker.requestPermissions();
      }
      const { files } = await FilePicker.pickImages({ limit: 1, readData: false });
      const f = files[0];
      if (!f) {
        return;
      }
      this.liberarPrevia();
      if (f.blob) {
        const url = URL.createObjectURL(f.blob);
        this.previewRevokable = url;
        this.previewUrl.set(url);
        return;
      }
      if (f.path) {
        this.previewUrl.set(Capacitor.convertFileSrc(f.path));
        return;
      }
      this.previewUrl.set(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('canceled') || msg.includes('cancelled')) {
        return;
      }
      await this.exibirToast('Não foi possível abrir a galeria. Tente outra vez.', false);
    }
  }

  excluirFotoPrevia(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.liberarPrevia();
    this.previewUrl.set(null);
  }

  abrirVisualizadorFoto(url: string, alt: string): void {
    const u = url.trim();
    if (!u) {
      return;
    }
    this.visualizadorFotoSrc.set(u);
    this.visualizadorFotoAlt.set(alt);
    this.visualizadorFotoAberto.set(true);
  }

  fecharVisualizadorFoto(): void {
    this.visualizadorFotoAberto.set(false);
    this.visualizadorFotoSrc.set('');
    this.visualizadorFotoAlt.set('');
  }

  abrirFotoPeloCard(): void {
    void this.abrirMenuFoto();
  }

  private async abrirMenuFoto(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Foto do convidado',
      cssClass: 'fotografar-foto-action-sheet',
      mode: 'ios',
      buttons: [
        {
          text: 'Tirar foto',
          icon: 'camera-outline',
          handler: () => {
            void this.abrirCameraNativaSeDisponivel();
            return true;
          },
        },
        {
          text: 'Selecionar da galeria',
          icon: 'image-outline',
          handler: () => {
            void this.selecionarDaGaleriaComFilePicker();
            return true;
          },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  private async exibirToast(msg: string, sucesso: boolean): Promise<void> {
    const t = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: sucesso ? 'success' : 'warning',
      position: 'top',
    });
    await t.present();
  }

  async cadastrarEEnviar(): Promise<void> {
    if (!this.podeEnviar()) {
      await this.exibirToast('Preencha o evento, o nome e a foto.', false);
      return;
    }
    const nome = this.guestName().trim();
    const url = this.previewUrl()!;
    const id = `envio-${this.nextEnvioId++}`;
    const fotografo = this.userName().trim() || '—';
    const eventoId = this.eventoId()!;

    this.historico.update(
      (lista) => [{ id, eventoId, nome, thumbUrl: url, fotografo }, ...lista]
    );

    this.previewRevokable = null;
    this.previewUrl.set(null);
    this.guestName.set('');

    await this.exibirToast('Foto cadastrada e enviada.', true);
  }

  ngOnDestroy(): void {
    this.eventoTabletMq?.removeEventListener('change', this.syncEventoSelectInterface);

    for (const h of this.historico()) {
      this.revogarSeBlob(h.thumbUrl);
    }
    const atual = this.previewUrl();
    if (atual) {
      this.revogarSeBlob(atual);
    }
  }

  private revogarSeBlob(url: string | undefined): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
