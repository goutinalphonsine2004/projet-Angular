import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Services
import { ErrorService, AppError } from '../../services/error.service';

// Components
import { ErrorAlertComponent } from '../../components/error-alert/error-alert';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ErrorAlertComponent
  ],
  templateUrl: './error.html',
  styleUrl: './error.scss'
})
export class ErrorComponent implements OnInit, OnDestroy {
  // Propriétés d'erreur
  errorCode: string = '404';
  errorTitle: string = 'Page non trouvée';
  errorMessage: string = 'La page que vous recherchez n\'existe pas ou a été déplacée.';
  errorDetails: string = 'Vérifiez l\'URL ou utilisez la navigation pour accéder à une autre page.';
  
  // Actions disponibles
  showHomeButton: boolean = true;
  showBackButton: boolean = true;
  showSearchButton: boolean = true;
  showHelpButton: boolean = false;
  
  // États
  isLoading: boolean = false;
  errorMessageFromService: AppError | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupErrorHandling();
    this.loadErrorFromRoute();
    this.setupErrorType();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configure la gestion des erreurs
   */
  private setupErrorHandling(): void {
    this.errorService.globalError$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.errorMessageFromService = error;
    });
  }

  /**
   * Charge les informations d'erreur depuis la route
   */
  private loadErrorFromRoute(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['code']) {
        this.errorCode = params['code'];
      }
      if (params['title']) {
        this.errorTitle = params['title'];
      }
      if (params['message']) {
        this.errorMessage = params['message'];
      }
      if (params['details']) {
        this.errorDetails = params['details'];
      }
      
      // Configurer les boutons selon le type d'erreur
      this.setupErrorType();
    });
  }

  /**
   * Configure le type d'erreur et les actions disponibles
   */
  private setupErrorType(): void {
    switch (this.errorCode) {
      case '404':
        this.setup404Error();
        break;
      case '500':
        this.setup500Error();
        break;
      case '403':
        this.setup403Error();
        break;
      case '401':
        this.setup401Error();
        break;
      case 'network':
        this.setupNetworkError();
        break;
      case 'api':
        this.setupApiError();
        break;
      case 'geolocation':
        this.setupGeolocationError();
        break;
      default:
        this.setupGenericError();
        break;
    }
  }

  /**
   * Configure l'erreur 404
   */
  private setup404Error(): void {
    this.errorTitle = 'Page non trouvée';
    this.errorMessage = 'La page que vous recherchez n\'existe pas ou a été déplacée.';
    this.errorDetails = 'Vérifiez l\'URL ou utilisez la navigation pour accéder à une autre page.';
    this.showHomeButton = true;
    this.showBackButton = true;
    this.showSearchButton = true;
    this.showHelpButton = false;
  }

  /**
   * Configure l'erreur 500
   */
  private setup500Error(): void {
    this.errorTitle = 'Erreur serveur';
    this.errorMessage = 'Une erreur interne s\'est produite sur le serveur.';
    this.errorDetails = 'Veuillez réessayer plus tard ou contacter le support si le problème persiste.';
    this.showHomeButton = true;
    this.showBackButton = true;
    this.showSearchButton = false;
    this.showHelpButton = true;
  }

  /**
   * Configure l'erreur 403
   */
  private setup403Error(): void {
    this.errorTitle = 'Accès interdit';
    this.errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.';
    this.errorDetails = 'Connectez-vous avec un compte ayant les droits appropriés.';
    this.showHomeButton = true;
    this.showBackButton = true;
    this.showSearchButton = false;
    this.showHelpButton = true;
  }

  /**
   * Configure l'erreur 401
   */
  private setup401Error(): void {
    this.errorTitle = 'Non autorisé';
    this.errorMessage = 'Vous devez être connecté pour accéder à cette page.';
    this.errorDetails = 'Veuillez vous connecter ou créer un compte.';
    this.showHomeButton = true;
    this.showBackButton = true;
    this.showSearchButton = false;
    this.showHelpButton = false;
  }

  /**
   * Configure l'erreur réseau
   */
  private setupNetworkError(): void {
    this.errorTitle = 'Erreur de connexion';
    this.errorMessage = 'Impossible de se connecter au serveur.';
    this.errorDetails = 'Vérifiez votre connexion internet et réessayez.';
    this.showHomeButton = true;
    this.showBackButton = true;
    this.showSearchButton = false;
    this.showHelpButton = false;
  }

  /**
   * Configure l'erreur API
   */
  private setupApiError(): void {
    this.errorTitle = 'Erreur de service';
    this.errorMessage = 'Le service météo est temporairement indisponible.';
    this.errorDetails = 'Veuillez réessayer dans quelques minutes.';
    this.showHomeButton = true;
    this.showBackButton = true;
    this.showSearchButton = false;
    this.showHelpButton = false;
  }

  /**
   * Configure l'erreur de géolocalisation
   */
  private setupGeolocationError(): void {
    this.errorTitle = 'Géolocalisation impossible';
    this.errorMessage = 'Impossible d\'obtenir votre position actuelle.';
    this.errorDetails = 'Vérifiez les permissions de géolocalisation ou recherchez une ville manuellement.';
    this.showHomeButton = true;
    this.showBackButton = false;
    this.showSearchButton = true;
    this.showHelpButton = false;
  }

  /**
   * Configure une erreur générique
   */
  private setupGenericError(): void {
    this.errorTitle = 'Une erreur s\'est produite';
    this.errorMessage = 'Un problème inattendu s\'est produit.';
    this.errorDetails = 'Veuillez réessayer ou naviguer vers une autre page.';
    this.showHomeButton = true;
    this.showBackButton = true;
    this.showSearchButton = true;
    this.showHelpButton = false;
  }

  // ===== NAVIGATION =====

  /**
   * Navigue vers l'accueil
   */
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Retourne à la page précédente
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Navigue vers la page de recherche
   */
  navigateToSearch(): void {
    this.router.navigate(['/'], { 
      queryParams: { 
        showSearch: 'true' 
      } 
    });
  }

  /**
   * Navigue vers la page d'aide
   */
  navigateToHelp(): void {
    // Navigation vers une page d'aide (à implémenter)
    this.router.navigate(['/']);
  }

  /**
   * Recharge la page actuelle
   */
  reloadPage(): void {
    window.location.reload();
  }

  /**
   * Obtient l'icône appropriée selon le code d'erreur
   */
  getErrorIcon(): string {
    switch (this.errorCode) {
      case '404':
        return 'bi-search';
      case '500':
        return 'bi-exclamation-triangle';
      case '403':
        return 'bi-shield-exclamation';
      case '401':
        return 'bi-person-x';
      case 'network':
        return 'bi-wifi-off';
      case 'api':
        return 'bi-cloud-slash';
      case 'geolocation':
        return 'bi-geo-alt';
      default:
        return 'bi-exclamation-circle';
    }
  }

  /**
   * Obtient la classe CSS pour l'icône d'erreur
   */
  getErrorIconClass(): string {
    switch (this.errorCode) {
      case '404':
        return 'text-info';
      case '500':
        return 'text-danger';
      case '403':
        return 'text-warning';
      case '401':
        return 'text-warning';
      case 'network':
        return 'text-danger';
      case 'api':
        return 'text-warning';
      case 'geolocation':
        return 'text-info';
      default:
        return 'text-secondary';
    }
  }

  /**
   * Obtient la classe CSS pour le bouton principal
   */
  getPrimaryButtonClass(): string {
    switch (this.errorCode) {
      case '404':
        return 'btn-primary';
      case '500':
        return 'btn-danger';
      case '403':
        return 'btn-warning';
      case '401':
        return 'btn-warning';
      case 'network':
        return 'btn-danger';
      case 'api':
        return 'btn-warning';
      case 'geolocation':
        return 'btn-info';
      default:
        return 'btn-primary';
    }
  }

  /**
   * Obtient la classe CSS pour le conteneur d'erreur
   */
  getErrorContainerClass(): string {
    switch (this.errorCode) {
      case '404':
        return 'error-404';
      case '500':
        return 'error-500';
      case '403':
        return 'error-403';
      case '401':
        return 'error-401';
      case 'network':
        return 'error-network';
      case 'api':
        return 'error-api';
      case 'geolocation':
        return 'error-geolocation';
      default:
        return 'error-generic';
    }
  }

  // ===== GESTION DES ERREURS =====

  /**
   * Efface l'erreur
   */
  clearError(): void {
    this.errorMessageFromService = null;
    this.errorService.clearGlobalError();
  }

  /**
   * Gère l'action d'erreur
   */
  onErrorAction(error: AppError): void {
    if (error.actionCallback) {
      error.actionCallback();
    }
  }

  /**
   * Recharge la page
   */
  reloadCurrentPage(): void {
    this.isLoading = true;
    
    setTimeout(() => {
      this.reloadPage();
    }, 1000);
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Obtient le message d'aide selon le type d'erreur
   */
  getHelpMessage(): string {
    switch (this.errorCode) {
      case '404':
        return 'Vérifiez l\'orthographe de l\'URL ou utilisez la navigation.';
      case '500':
        return 'Le problème vient de nos serveurs. Réessayez plus tard.';
      case '403':
        return 'Connectez-vous avec un compte ayant les droits appropriés.';
      case '401':
        return 'Créez un compte ou connectez-vous pour continuer.';
      case 'network':
        return 'Vérifiez votre connexion internet et réessayez.';
      case 'api':
        return 'Le service météo est temporairement indisponible.';
      case 'geolocation':
        return 'Autorisez la géolocalisation ou recherchez une ville.';
      default:
        return 'Vérifiez vos paramètres et réessayez.';
    }
  }

  /**
   * Obtient les suggestions d'actions selon le type d'erreur
   */
  getSuggestions(): string[] {
    switch (this.errorCode) {
      case '404':
        return [
          'Vérifiez l\'orthographe de l\'URL',
          'Utilisez la navigation principale',
          'Recherchez une ville spécifique'
        ];
      case '500':
        return [
          'Rafraîchissez la page',
          'Vérifiez votre connexion',
          'Réessayez dans quelques minutes'
        ];
      case '403':
        return [
          'Connectez-vous avec un autre compte',
          'Vérifiez vos permissions',
          'Contactez l\'administrateur'
        ];
      case '401':
        return [
          'Créez un nouveau compte',
          'Connectez-vous avec vos identifiants',
          'Vérifiez vos informations'
        ];
      case 'network':
        return [
          'Vérifiez votre connexion internet',
          'Désactivez temporairement votre pare-feu',
          'Essayez un autre réseau'
        ];
      case 'api':
        return [
          'Vérifiez votre clé API',
          'Attendez quelques minutes',
          'Vérifiez le statut du service'
        ];
      case 'geolocation':
        return [
          'Autorisez la géolocalisation',
          'Recherchez une ville manuellement',
          'Vérifiez les permissions du navigateur'
        ];
      default:
        return [
          'Rafraîchissez la page',
          'Vérifiez vos paramètres',
          'Contactez le support'
        ];
    }
  }

  /**
   * Obtient le code d'erreur formaté
   */
  getFormattedErrorCode(): string {
    return `Erreur ${this.errorCode}`;
  }

  /**
   * Vérifie si c'est une erreur critique
   */
  isCriticalError(): boolean {
    return ['500', 'network', 'api'].includes(this.errorCode);
  }

  /**
   * Vérifie si c'est une erreur de permission
   */
  isPermissionError(): boolean {
    return ['403', '401'].includes(this.errorCode);
  }

  /**
   * Vérifie si c'est une erreur de navigation
   */
  isNavigationError(): boolean {
    return ['404'].includes(this.errorCode);
  }
}
