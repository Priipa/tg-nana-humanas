import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

/**
 * Carregado em `path: 'tabs'` (app.routes). path raiz '' + filhos: `/tabs/fotografar`, etc.
 */
export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'fotografar',
        loadComponent: () =>
          import('../../pages/fotografar/fotografar.page').then((m) => m.FotografarPage),
      },
      {
        path: 'vetorizar',
        loadComponent: () =>
          import('../../pages/vetorizar/vetorizar').then((m) => m.VetorizarPage),
      },
      {
        path: 'aquarelar',
        loadComponent: () =>
          import('../../pages/aquarelar/aquarelar.page').then((m) => m.AquarelarPage),
      },
      {
        path: '',
        redirectTo: 'fotografar',
        pathMatch: 'full',
      },
    ],
  },
];
