import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppError } from '../../services/error.service';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-alert.html',
  styleUrl: './error-alert.scss'
})
export class ErrorAlertComponent {
  @Input() error: AppError | null = null;
  @Input() dismissible: boolean = true;
  @Input() animated: boolean = true;
  @Input() showIcon: boolean = true;
  @Input() showActions: boolean = true;
  
  @Output() dismissEvent = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<AppError>();

  /**
   * Retourne la classe CSS Bootstrap selon le type d'erreur
   */
  getAlertClass(): string {
    if (!this.error) return 'alert-info';
    
    switch (this.error.type) {
      case 'error':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  }

  /**
   * Retourne la classe de l'icône selon le type d'erreur
   */
  getIconClass(): string {
    if (!this.error) return 'fas fa-info-circle';
    
    switch (this.error.type) {
      case 'error':
        return 'fas fa-exclamation-circle text-danger';
      case 'warning':
        return 'fas fa-exclamation-triangle text-warning';
      case 'info':
        return 'fas fa-info-circle text-info';
      default:
        return 'fas fa-info-circle text-info';
    }
  }

  /**
   * Retourne la classe du bouton d'action selon le type d'erreur
   */
  getActionButtonClass(): string {
    if (!this.error) return 'btn-outline-secondary';
    
    switch (this.error.type) {
      case 'error':
        return 'btn-outline-danger';
      case 'warning':
        return 'btn-outline-warning';
      case 'info':
        return 'btn-outline-info';
      default:
        return 'btn-outline-secondary';
    }
  }

  /**
   * Gère le clic sur le bouton d'action
   */
  onActionClick(): void {
    if (this.error && this.error.actionCallback) {
      this.error.actionCallback();
    }
    this.actionClick.emit(this.error!);
  }

  /**
   * Ferme l'alerte
   */
  dismiss(): void {
    this.dismissEvent.emit();
  }
}
