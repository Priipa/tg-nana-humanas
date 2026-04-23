import { Camera, CameraDirection, type MediaResult, MediaType } from '@capacitor/camera';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Capacitor } from '@capacitor/core';
import { Component, computed, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, cameraOutline, imageOutline, searchOutline } from 'ionicons/icons';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

export type EventoOption = { id: string; titulo: string };

export type EnvioHistorico = { id: string; nome: string; thumbUrl: string };

@Component({
  selector: 'app-fotografar',
  templateUrl: 'fotografar.page.html',
  styleUrls: ['fotografar.page.scss'],
  imports: [IonContent, IonButton, IonIcon, IonInput, IonSelect, IonSelectOption],
})
export class FotografarPage implements OnDestroy {
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly toastController = inject(ToastController);

  /** O `#cameraInput` no template é exposto como `ElementRef` — usar `.nativeElement` para `.click()`. */
  private readonly cameraInput = viewChild.required<ElementRef<HTMLInputElement>>('cameraInput');

  userName = signal('Usuário');

  eventos: EventoOption[] = [
    { id: '1', titulo: 'Casamento F. & M.' },
    { id: '2', titulo: 'Aniversário 15 anos' },
  ];

  eventoId = signal<string | undefined>(undefined);
  guestName = signal('');
  searchQuery = signal('');

  previewUrl = signal<string | null>(null);
  private previewRevokable: string | null = null;

  private nextEnvioId = 3;

  historico = signal<EnvioHistorico[]>([
    { id: 'h-1', nome: 'Mariana Ayres', thumbUrl: '' },
    { id: 'h-2', nome: 'Mariana Ayres', thumbUrl: '' },
  ]);

  totalEnvios = computed(() => this.historico().length);

  historicoFiltrado = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.historico();
    }
    return this.historico().filter((h) => h.nome.toLowerCase().includes(q));
  });

  podeEnviar = computed(
    () =>
      this.eventoId() !== undefined &&
      this.guestName().trim().length > 0 &&
      this.previewUrl() !== null
  );

  constructor() {
    addIcons({ close, cameraOutline, imageOutline, searchOutline });
  }

  onEventoChange(event: CustomEvent): void {
    const v = (event.detail as { value?: string | null }).value;
    this.eventoId.set(
      v === null || v === undefined || (typeof v === 'string' && v === '') ? undefined : String(v)
    );
  }

  onGuestInput(event: Event): void {
    const e = event as CustomEvent<{ value?: string | null }>;
    this.guestName.set(e.detail.value ?? '');
  }

  onSearchInput(event: Event): void {
    const e = event as CustomEvent<{ value?: string | null }>;
    this.searchQuery.set(e.detail.value ?? '');
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

    this.historico.update((lista) => [{ id, nome, thumbUrl: url }, ...lista]);

    this.previewRevokable = null;
    this.previewUrl.set(null);
    this.guestName.set('');

    await this.exibirToast('Foto cadastrada e enviada.', true);
  }

  ngOnDestroy(): void {
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
