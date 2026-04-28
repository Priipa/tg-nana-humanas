import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

/** Estilos dentro do shadow de `ion-alert` não são atingíveis por CSS global — só por JS. */
const NANA_EVENTO_ALERT_LABEL_STYLE_ID = 'nana-evento-alert-centrar-eventos';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private alertMutationObserver?: MutationObserver;
  private mutationFlushScheduled = false;

  /**
   * Injeta regras no shadow do alert para centrar os nomes dos eventos.
   * Usado pelo evento Ionic e por MutationObserver (fallback).
   */
  private readonly scheduleInjectCenterStyles = (alertHost: HTMLElement, depth = 0): void => {
    if (alertHost.tagName !== 'ION-ALERT' || !alertHost.classList.contains('nana-evento-alert')) {
      return;
    }
    const sr = alertHost.shadowRoot;
    if (!sr) {
      if (depth < 120) {
        requestAnimationFrame(() => this.scheduleInjectCenterStyles(alertHost, depth + 1));
      }
      return;
    }
    if (sr.getElementById(NANA_EVENTO_ALERT_LABEL_STYLE_ID)) {
      return;
    }
    let tries = 0;
    const inject = (): void => {
      if (++tries > 80 || sr.getElementById(NANA_EVENTO_ALERT_LABEL_STYLE_ID)) {
        return;
      }
      if (!sr.querySelector('.alert-radio-group') && !sr.querySelector('.alert-button-group')) {
        requestAnimationFrame(inject);
        return;
      }
      const style = document.createElement('style');
      style.id = NANA_EVENTO_ALERT_LABEL_STYLE_ID;
      style.textContent = `
        .alert-radio-group .alert-tappable.alert-radio {
          text-align: center !important;
        }
        .alert-radio-group .alert-button-inner {
          justify-content: center !important;
        }
        .alert-radio-group .alert-radio-label {
          text-align: center !important;
          flex: 1 1 auto !important;
          max-width: 100%;
        }
        /* iOS: .alert-button:last-child usa font-weight: bold — igualar a Cancelar em todos os níveis */
        .alert-button-group .alert-button,
        .alert-button-group .alert-button:last-child {
          font-weight: normal !important;
        }
        .alert-button-group .alert-button .alert-button-inner {
          font-weight: normal !important;
        }
      `;
      sr.appendChild(style);
    };
    requestAnimationFrame(inject);
  };

  private readonly onIonAlertDidPresent = (ev: Event): void => {
    /** Com eventos `composed`, `target` por vezes não é o `ion-alert` — usar `composedPath`. */
    const path = ev.composedPath();
    const el = path.find(
      (n): n is HTMLElement => n instanceof HTMLElement && n.tagName === 'ION-ALERT'
    );
    if (!el) {
      return;
    }
    this.scheduleInjectCenterStyles(el);
  };

  /** Fallback: se o evento falhar (timing, etc.), o alert continua no DOM e é detetado aqui. */
  private readonly flushAlertsFromDom = (): void => {
    this.mutationFlushScheduled = false;
    document.querySelectorAll('ion-alert.nana-evento-alert').forEach((node) => {
      this.scheduleInjectCenterStyles(node as HTMLElement);
    });
  };

  private readonly scheduleMutationFlush = (): void => {
    if (this.mutationFlushScheduled) {
      return;
    }
    this.mutationFlushScheduled = true;
    requestAnimationFrame(() => this.flushAlertsFromDom());
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('ionAlertDidPresent', this.onIonAlertDidPresent, true);
      this.alertMutationObserver = new MutationObserver(() => this.scheduleMutationFlush());
      this.alertMutationObserver.observe(document.body, { childList: true, subtree: true });
      this.flushAlertsFromDom();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('ionAlertDidPresent', this.onIonAlertDidPresent, true);
      this.alertMutationObserver?.disconnect();
    }
  }
}
