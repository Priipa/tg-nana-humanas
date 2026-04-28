import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CustomHeaderComponent } from '../../componentes/custom-header/custom-header.component';
import { VisualizadorFotoComponent } from '../../componentes/visualizador-foto/visualizador-foto.component';
import {
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  PopoverController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  cloudUploadOutline,
  documentTextOutline,
  downloadOutline,
  ellipsisVerticalOutline,
  playOutline,
  trashOutline,
} from 'ionicons/icons';
import type { EventoOption } from '../fotografar/fotografar.page';
import { VetorizarEmProcessoMenuComponent } from './vetorizar-em-processo-menu.component';
import { VetorizarFinalizadoMenuComponent } from './vetorizar-finalizado-menu.component';

export type SituacaoVetorFiltro = 'pendentes' | 'em-processo' | 'finalizados';

/** Item da fila de vetorização pendente (mock; API depois). */
export type PendenteVetorItem = {
  id: string;
  eventoId: string;
  nome: string;
  fotografo: string;
  thumbUrl: string;
};

export type AnexoVetor = {
  nome: string;
  tamanhoLabel: string;
  previewObjectUrl: string;
  ficheiro: File;
  mime: string;
};

export type EmProcessoVetorItem = {
  id: string;
  eventoId: string;
  nome: string;
  fotografo: string;
  thumbUrl: string;
  /** Quem clicou em "Iniciar" (operador / sessão). */
  inicializadoPor: string;
  /** null = só zona de upload; com valor = ficheiro anexado */
  vetorAnexado: AnexoVetor | null;
};

export type FinalizadoVetorItem = {
  id: string;
  eventoId: string;
  nome: string;
  /** Quem registou a foto (substitui “evento” no card). */
  fotografo: string;
  /** Operador que concluiu a vetorização (Finalizar). */
  vetorizadoPor: string;
  thumbOriginalUrl: string;
  /** URL do ficheiro vetorizado (p.ex. blob:); libertar em ngOnDestroy / remover. */
  thumbVetorUrl: string;
  vetorMime: string;
  vetorNomeArquivo: string;
};

const MAX_TAMANHO_VETOR_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-vetorizar',
  templateUrl: 'vetorizar.html',
  styleUrls: ['vetorizar.scss'],
  imports: [
    NgClass,
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
    CustomHeaderComponent,
    VisualizadorFotoComponent,
  ],
})
export class VetorizarPage implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toastController = inject(ToastController);
  private readonly popoverController = inject(PopoverController);

  eventos: EventoOption[] = [
    { id: '1', titulo: 'Casamento F. & M.' },
    { id: '2', titulo: 'Aniversário 15 anos' },
  ];

  eventoId = signal<string | undefined>(undefined);
  filtroSituacao = signal<SituacaoVetorFiltro>('pendentes');

  /** Nome exibido no header e em "Inicializado" (mock; alinhar com sessão quando existir). */
  userName = signal('Usuário');

  visualizadorFotoAberto = signal(false);
  visualizadorFotoSrc = signal('');
  visualizadorFotoAlt = signal('');

  totalRegistros = signal(100);
  totalVetorizado = signal('80%');

  /**
   * Em tablets (≥768px) usa `alert` (centrado); em telemóveis mantém `action-sheet` (base).
   */
  eventoSelectInterface = signal<'action-sheet' | 'alert'>('action-sheet');
  eventoSelectInterfaceOptions = computed(() => {
    if (this.eventoSelectInterface() === 'alert') {
      return {
        header: 'Selecione o evento' as const,
        cssClass: 'nana-evento-alert',
        /** Cantos arredondados (~13px) e tipografia iOS; cores em `global.scss`. */
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

  pendentes = signal<PendenteVetorItem[]>([
    {
      id: 'p-1',
      eventoId: '1',
      nome: 'Mariana Ayres',
      fotografo: 'Giovanna Nascimento',
      thumbUrl: 'assets/fotos-mock/2photo.jpeg',
    },
    {
      id: 'p-2',
      eventoId: '1',
      nome: 'Fernando Henrique Nascimento',
      fotografo: 'Giovanna',
      thumbUrl: 'assets/fotos-mock/1photo.jpeg',
    },
    {
      id: 'p-3',
      eventoId: '2',
      nome: 'Convidado A',
      fotografo: 'Giovanna',
      thumbUrl: 'assets/fotos-mock/3photo.jpeg',
    },
  ]);

  emProcesso = signal<EmProcessoVetorItem[]>([]);
  finalizados = signal<FinalizadoVetorItem[]>([]);

  pendentesDoEvento = computed(() => {
    const e = this.eventoId();
    if (e === undefined) {
      return [] as PendenteVetorItem[];
    }
    return this.pendentes().filter((p) => p.eventoId === e);
  });

  emProcessoDoEvento = computed(() => {
    const e = this.eventoId();
    if (e === undefined) {
      return [] as EmProcessoVetorItem[];
    }
    return this.emProcesso().filter((p) => p.eventoId === e);
  });

  finalizadosDoEvento = computed(() => {
    const e = this.eventoId();
    if (e === undefined) {
      return [] as FinalizadoVetorItem[];
    }
    return this.finalizados().filter((p) => p.eventoId === e);
  });

  constructor() {
    addIcons({
      arrowForwardOutline,
      downloadOutline,
      playOutline,
      ellipsisVerticalOutline,
      cloudUploadOutline,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      trashOutline,
      documentTextOutline,
    });

    if (isPlatformBrowser(this.platformId)) {
      this.eventoTabletMq = window.matchMedia('(min-width: 768px)');
      this.syncEventoSelectInterface();
      this.eventoTabletMq.addEventListener('change', this.syncEventoSelectInterface);
    }
  }

  ngOnDestroy(): void {
    this.eventoTabletMq?.removeEventListener('change', this.syncEventoSelectInterface);

    for (const it of this.emProcesso()) {
      if (it.vetorAnexado) {
        URL.revokeObjectURL(it.vetorAnexado.previewObjectUrl);
      }
    }
    for (const fin of this.finalizados()) {
      if (fin.thumbVetorUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fin.thumbVetorUrl);
      }
    }
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

  /**
   * Remove da aba Pendentes e cria o card em "Em processo" (só upload até anexar).
   * Muda a aba ativa para Em processo.
   */
  moverPendenteParaEmProcesso(p: PendenteVetorItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.pendentes.update((lista) => lista.filter((x) => x.id !== p.id));
    const id = `ep-${p.id}-${Date.now()}`;
    const operador = this.userName().trim() || '—';
    const item: EmProcessoVetorItem = {
      id,
      eventoId: p.eventoId,
      nome: p.nome,
      fotografo: p.fotografo,
      thumbUrl: p.thumbUrl,
      inicializadoPor: operador,
      vetorAnexado: null,
    };
    this.emProcesso.update((l) => [...l, item]);
    this.filtroSituacao.set('em-processo');
  }

  async abrirMenuEmProcesso(ev: Event, item: EmProcessoVetorItem): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();
    const popover = await this.popoverController.create({
      component: VetorizarEmProcessoMenuComponent,
      componentProps: { item },
      cssClass: 'vetor-ep-popover-shell',
      event: ev,
      alignment: 'end',
      side: 'bottom',
      showBackdrop: true,
      translucent: false,
    });
    await popover.present();
    const { data, role } = await popover.onDidDismiss<EmProcessoVetorItem>();
    if (role === 'confirm' && data) {
      this.voltarEmProcessoParaPendentes(data);
    }
  }

  /** Devolve o registo à fila Pendentes (ex.: “Marcar como não iniciado”). */
  voltarEmProcessoParaPendentes(item: EmProcessoVetorItem): void {
    if (item.vetorAnexado) {
      URL.revokeObjectURL(item.vetorAnexado.previewObjectUrl);
    }
    this.emProcesso.update((lista) => lista.filter((x) => x.id !== item.id));
    const pendente: PendenteVetorItem = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      eventoId: item.eventoId,
      nome: item.nome,
      fotografo: item.fotografo,
      thumbUrl: item.thumbUrl,
    };
    this.pendentes.update((lista) => [...lista, pendente]);
    this.filtroSituacao.set('pendentes');
    void this.mostrarToast('Devolvido à fila de pendentes.', true);
  }

  onVetorFicheiroEscolhido(item: EmProcessoVetorItem, ev: Event): void {
    const el = ev.target as HTMLInputElement;
    const f = el.files?.[0] ?? null;
    el.value = '';
    if (!f) {
      return;
    }
    if (f.size > MAX_TAMANHO_VETOR_BYTES) {
      void this.mostrarToast('O ficheiro deve ter no máximo 10 MB.');
      return;
    }
    const ext = f.name.toLowerCase();
    const mimeOk =
      f.type === 'image/png' ||
      f.type === 'image/svg+xml' ||
      f.type === 'image/jpeg' ||
      f.type === 'application/pdf' ||
      ext.endsWith('.svg') ||
      ext.endsWith('.png') ||
      ext.endsWith('.pdf') ||
      ext.endsWith('.jpg') ||
      ext.endsWith('.jpeg');
    if (!mimeOk) {
      void this.mostrarToast('Só se aceitam PNG, SVG ou PDF.');
      return;
    }
    const objectUrl = URL.createObjectURL(f);
    this.emProcesso.update((lista) => {
      return lista.map((it) => {
        if (it.id !== item.id) {
          return it;
        }
        if (it.vetorAnexado) {
          URL.revokeObjectURL(it.vetorAnexado.previewObjectUrl);
        }
        return {
          ...it,
          vetorAnexado: {
            nome: f.name,
            tamanhoLabel: this.formatarTamanhoFicheiro(f.size),
            previewObjectUrl: objectUrl,
            ficheiro: f,
            mime: f.type,
          },
        };
      });
    });
  }

  removerVetorAnexado(item: EmProcessoVetorItem): void {
    this.limparVetorAnexadoId(item.id);
  }

  private limparVetorAnexadoId(id: string): void {
    this.emProcesso.update((lista) =>
      lista.map((it) => {
        if (it.id !== id) {
          return it;
        }
        if (it.vetorAnexado) {
          URL.revokeObjectURL(it.vetorAnexado.previewObjectUrl);
        }
        return { ...it, vetorAnexado: null };
      })
    );
  }

  mostrarPreviaComoImagem(mime: string, nome: string): boolean {
    const n = nome.toLowerCase();
    if (mime === 'application/pdf' || n.endsWith('.pdf')) {
      return false;
    }
    if (mime.startsWith('image/') || n.endsWith('.svg') || n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg')) {
      return true;
    }
    return false;
  }

  private formatarTamanhoFicheiro(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb >= 10 ? Math.round(kb) : Math.round(kb * 10) / 10} KB`;
    }
    const mb = kb / 1024;
    return `${(Math.round(mb * 10) / 10).toString().replace('.', ',')} MB`;
  }

  finalizarVetor(item: EmProcessoVetorItem, ev: Event): void {
    ev.preventDefault();
    if (!item.vetorAnexado) {
      return;
    }
    const v = item.vetorAnexado;
    const fin: FinalizadoVetorItem = {
      id: `fin-${item.id}-${Date.now()}`,
      eventoId: item.eventoId,
      nome: item.nome,
      fotografo: item.fotografo,
      vetorizadoPor: this.userName().trim() || '—',
      thumbOriginalUrl: item.thumbUrl,
      thumbVetorUrl: v.previewObjectUrl,
      vetorMime: v.mime,
      vetorNomeArquivo: v.nome,
    };
    this.emProcesso.update((l) => l.filter((x) => x.id !== item.id));
    this.finalizados.update((f) => [...f, fin]);
    this.filtroSituacao.set('finalizados');
    void this.mostrarToast('Vetorização finalizada.', true);
  }

  async abrirMenuFinalizado(ev: Event, f: FinalizadoVetorItem): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();
    const popover = await this.popoverController.create({
      component: VetorizarFinalizadoMenuComponent,
      componentProps: { item: f },
      cssClass: 'vetor-ep-popover-shell',
      event: ev,
      alignment: 'end',
      side: 'bottom',
      showBackdrop: true,
      translucent: false,
    });
    await popover.present();
    const { data, role } = await popover.onDidDismiss<FinalizadoVetorItem>();
    if (!data) {
      return;
    }
    if (role === 'baixar') {
      await this.baixarVetorFinalizado(data);
      return;
    }
    if (role === 'baixar-original') {
      await this.baixarOriginalFinalizado(data);
      return;
    }
    if (role === 'em-processo') {
      this.finalizadoParaEmProcesso(data);
    }
  }

  /** Devolve o registo à fila “Em processo” (sem anexo; novo ciclo de upload). */
  finalizadoParaEmProcesso(f: FinalizadoVetorItem): void {
    if (f.thumbVetorUrl.startsWith('blob:')) {
      URL.revokeObjectURL(f.thumbVetorUrl);
    }
    this.finalizados.update((lista) => lista.filter((x) => x.id !== f.id));
    const item: EmProcessoVetorItem = {
      id: `ep-desfin-${f.id}-${Date.now()}`,
      eventoId: f.eventoId,
      nome: f.nome,
      fotografo: f.fotografo,
      thumbUrl: f.thumbOriginalUrl,
      inicializadoPor: this.userName().trim() || '—',
      vetorAnexado: null,
    };
    this.emProcesso.update((l) => [...l, item]);
    this.filtroSituacao.set('em-processo');
    void this.mostrarToast('Marcado em processo.', true);
  }

  private async baixarOriginalFinalizado(f: FinalizadoVetorItem): Promise<void> {
    const p: PendenteVetorItem = {
      id: f.id,
      eventoId: f.eventoId,
      nome: f.nome,
      fotografo: f.fotografo,
      thumbUrl: f.thumbOriginalUrl,
    };
    await this.baixarImagemPendente(p, new Event('click'));
  }

  private async baixarVetorFinalizado(f: FinalizadoVetorItem): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !f.thumbVetorUrl) {
      return;
    }
    const nome =
      f.vetorNomeArquivo.trim() ||
      `vetor-${this.sanitizarBaseNome(f.nome)}`;
    this.dispararDownloadComHref(f.thumbVetorUrl, nome, this.document);
  }

  private async mostrarToast(mensagem: string, sucesso: boolean = false): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const t = await this.toastController.create({
      message: mensagem,
      duration: 2000,
      color: sucesso ? 'success' : 'warning',
      position: 'top',
    });
    await t.present();
  }

  async baixarImagemPendente(p: PendenteVetorItem, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!isPlatformBrowser(this.platformId) || !p.thumbUrl) {
      return;
    }
    const nomeFicheiro = this.nomeFicheiroParaDownloadDePendente(p);
    const hrefAbs = this.resolverUrlAbsoluta(p.thumbUrl);
    const doc = this.document;
    if (p.thumbUrl.startsWith('blob:') || p.thumbUrl.startsWith('data:')) {
      this.dispararDownloadComHref(hrefAbs, nomeFicheiro, doc);
      return;
    }
    try {
      const r = await fetch(hrefAbs, { mode: 'cors' });
      if (!r.ok) {
        throw new Error(String(r.status));
      }
      const blob = await r.blob();
      const objectUrl = URL.createObjectURL(blob);
      this.dispararDownloadComHref(objectUrl, nomeFicheiro, doc);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } catch {
      this.dispararDownloadComHref(hrefAbs, nomeFicheiro, doc);
    }
  }

  private nomeFicheiroParaDownloadDePendente(p: PendenteVetorItem): string {
    const pathFicheiro = p.thumbUrl.split('?')[0]!.split('/').pop() || 'foto';
    const extM = pathFicheiro.match(/\.([a-z0-9]+)$/i);
    const ext = extM ? String(extM[1]).toLowerCase() : 'jpg';
    const base = this.sanitizarBaseNome(p.nome);
    return `${base}.${ext}`;
  }

  private sanitizarBaseNome(n: string): string {
    return (
      n
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'foto'
    );
  }

  private resolverUrlAbsoluta(url: string): string {
    if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    return new URL(url, this.document.baseURI).href;
  }

  private dispararDownloadComHref(href: string, downloadName: string, doc: Document): void {
    const a = doc.createElement('a');
    a.href = href;
    a.setAttribute('download', downloadName);
    a.style.display = 'none';
    a.rel = 'noopener';
    doc.body.appendChild(a);
    a.click();
    a.remove();
  }
}
