import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerType = 'default' | 'pulse' | 'wave' | 'dots' | 'bars';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss'
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() type: SpinnerType = 'default';
  @Input() overlay: boolean = false;
  @Input() message: string = '';
  @Input() subMessage: string = '';
  @Input() progress: number | null = null;
  @Input() spinnerType: string = 'default';

  /**
   * Retourne la classe CSS pour le type de spinner
   */
  getSpinnerClass(): string {
    return `spinner-${this.type}`;
  }

  /**
   * Retourne la classe CSS pour la taille
   */
  getSizeClass(): string {
    return `spinner-${this.size}`;
  }
}
