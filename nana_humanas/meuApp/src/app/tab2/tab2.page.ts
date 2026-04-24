import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CustomHeaderComponent } from '../componentes/custom-header/custom-header.component';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonContent, CustomHeaderComponent, ExploreContainerComponent],
})
export class Tab2Page {
  constructor() {}
}
