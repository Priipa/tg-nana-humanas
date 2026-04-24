import { Component, input } from '@angular/core';

/**
 * Cabeçalho comum das tabs (saudação + logótipo), alinhado ao estilo da área "Fotografar".
 */
@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss'],
  standalone: true,
  imports: [],
})
export class CustomHeaderComponent {
  userName = input<string>('Usuário');
}
