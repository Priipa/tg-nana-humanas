import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CustomHeaderComponent } from '../componentes/custom-header/custom-header.component';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [IonContent, CustomHeaderComponent, ExploreContainerComponent],
})
export class Tab3Page {
  constructor() {}
}
