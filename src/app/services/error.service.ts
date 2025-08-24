import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppError {
  id: string;
  title?: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: number;
  details?: string;
  action?: string;
  actionCallback?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorsSubject = new BehaviorSubject<AppError[]>([]);
  private globalErrorSubject = new BehaviorSubject<AppError | null>(null);

  public errors$ = this.errorsSubject.asObservable();
  public globalError$ = this.globalErrorSubject.asObservable();

  constructor() {}

  /**
   * Ajoute une erreur à la liste
   */
  addError(message: string, type: 'error' | 'warning' | 'info' = 'error', details?: string, action?: string, actionCallback?: () => void): string {
    const error: AppError = {
      id: this.generateId(),
      message,
      type,
      timestamp: Date.now(),
      details,
      action,
      actionCallback
    };

    const currentErrors = this.errorsSubject.value;
    const updatedErrors = [...currentErrors, error];
    
    // Limiter à 10 erreurs maximum
    if (updatedErrors.length > 10) {
      updatedErrors.shift();
    }

    this.errorsSubject.next(updatedErrors);

    // Si c'est une erreur critique, l'afficher globalement
    if (type === 'error') {
      this.setGlobalError(error);
    }

    return error.id;
  }

  /**
   * Supprime une erreur spécifique
   */
  removeError(errorId: string): boolean {
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = currentErrors.filter(error => error.id !== errorId);
    
    if (updatedErrors.length !== currentErrors.length) {
      this.errorsSubject.next(updatedErrors);
      return true;
    }
    
    return false;
  }

  /**
   * Efface toutes les erreurs
   */
  clearAllErrors(): void {
    this.errorsSubject.next([]);
    this.clearGlobalError();
  }

  /**
   * Efface les erreurs par type
   */
  clearErrorsByType(type: 'error' | 'warning' | 'info'): void {
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = currentErrors.filter(error => error.type !== type);
    this.errorsSubject.next(updatedErrors);
  }

  /**
   * Efface les erreurs anciennes (plus de 1 heure)
   */
  clearOldErrors(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = currentErrors.filter(error => error.timestamp > oneHourAgo);
    this.errorsSubject.next(updatedErrors);
  }

  /**
   * Définit une erreur globale (pour affichage en haut de page)
   */
  setGlobalError(error: AppError): void {
    this.globalErrorSubject.next(error);
  }

  /**
   * Efface l'erreur globale
   */
  clearGlobalError(): void {
    this.globalErrorSubject.next(null);
  }

  /**
   * Gère les erreurs d'API spécifiques
   */
  handleApiError(error: any, context: string = 'API'): string {
    let message = 'Une erreur est survenue';
    let type: 'error' | 'warning' | 'info' = 'error';
    let details: string | undefined;

    if (error.status === 401) {
      message = 'Clé API invalide';
      details = 'Vérifiez votre configuration OpenWeatherMap';
      type = 'error';
    } else if (error.status === 404) {
      message = 'Ville non trouvée';
      details = 'Vérifiez l\'orthographe du nom de la ville';
      type = 'warning';
    } else if (error.status === 429) {
      message = 'Limite de requêtes atteinte';
      details = 'Réessayez dans quelques minutes';
      type = 'warning';
    } else if (error.status === 0) {
      message = 'Pas de connexion internet';
      details = 'Vérifiez votre connexion réseau';
      type = 'error';
    } else if (error.status >= 500) {
      message = 'Erreur serveur';
      details = 'Le service météo est temporairement indisponible';
      type = 'error';
    }

    return this.addError(
      `${context}: ${message}`,
      type,
      details,
      'Réessayer',
      () => this.retryAction(context)
    );
  }

  /**
   * Gère les erreurs de géolocalisation
   */
  handleGeolocationError(error: any): string {
    let message = 'Erreur de géolocalisation';
    let details: string | undefined;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        details = 'L\'accès à la géolocalisation a été refusé';
        break;
      case error.POSITION_UNAVAILABLE:
        details = 'Les informations de position ne sont pas disponibles';
        break;
      case error.TIMEOUT:
        details = 'La demande de géolocalisation a expiré';
        break;
      default:
        details = 'Une erreur inconnue s\'est produite';
    }

    return this.addError(
      message,
      'warning',
      details,
      'Réessayer',
      () => this.retryGeolocation()
    );
  }

  /**
   * Gère les erreurs de stockage
   */
  handleStorageError(error: any, operation: string): string {
    let message = 'Erreur de stockage';
    let details: string | undefined;

    if (error.name === 'QuotaExceededError') {
      details = 'L\'espace de stockage est insuffisant';
    } else if (error.name === 'SecurityError') {
      details = 'Accès au stockage refusé pour des raisons de sécurité';
    } else {
      details = `Erreur lors de l'opération: ${operation}`;
    }

    return this.addError(
      message,
      'warning',
      details,
      'Vider le cache',
      () => this.clearStorage()
    );
  }

  /**
   * Actions de retry
   */
  private retryAction(context: string): void {
    console.log(`Tentative de reconnexion pour: ${context}`);
    // Ici vous pouvez implémenter la logique de retry
    // Par exemple, relancer la requête API
  }

  private retryGeolocation(): void {
    console.log('Nouvelle tentative de géolocalisation');
    // Ici vous pouvez relancer la géolocalisation
  }

  private clearStorage(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
      this.addError(
        'Cache vidé avec succès',
        'info',
        'Les données temporaires ont été supprimées'
      );
    } catch (error) {
      this.addError(
        'Erreur lors du vidage du cache',
        'error',
        'Impossible de vider le cache'
      );
    }
  }

  /**
   * Génère un ID unique pour les erreurs
   */
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Récupère les erreurs actuelles
   */
  getCurrentErrors(): AppError[] {
    return this.errorsSubject.value;
  }

  /**
   * Récupère l'erreur globale actuelle
   */
  getCurrentGlobalError(): AppError | null {
    return this.globalErrorSubject.value;
  }

  /**
   * Vérifie s'il y a des erreurs actives
   */
  hasErrors(): boolean {
    return this.errorsSubject.value.length > 0;
  }

  /**
   * Vérifie s'il y a des erreurs critiques
   */
  hasCriticalErrors(): boolean {
    return this.errorsSubject.value.some(error => error.type === 'error');
  }

  /**
   * Compte les erreurs par type
   */
  getErrorCounts(): { error: number; warning: number; info: number } {
    const errors = this.errorsSubject.value;
    return {
      error: errors.filter(e => e.type === 'error').length,
      warning: errors.filter(e => e.type === 'warning').length,
      info: errors.filter(e => e.type === 'info').length
    };
  }
}
