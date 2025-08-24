import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Services
import { WeatherService } from '../../services/weather.service';
import { StorageService, FavoriteCity } from '../../services/storage.service';
import { ErrorService, AppError } from '../../services/error.service';

// Components
import { SearchBarComponent } from '../../components/search-bar/search-bar';
import { WeatherCardComponent } from '../../components/weather-card/weather-card';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { ErrorAlertComponent } from '../../components/error-alert/error-alert';

// Models
import { CurrentWeather, City } from '../../models/weather.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SearchBarComponent,
    WeatherCardComponent,
    LoadingSpinnerComponent,
    ErrorAlertComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  currentWeather: CurrentWeather | null = null;
  recentFavorites: FavoriteCity[] = [];
  isLoading: boolean = false;
  isLoadingLocation: boolean = false;
  loadingMessage: string = '';
  errorMessage: AppError | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private storageService: StorageService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.setupErrorHandling();
    this.loadDefaultWeather();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les favoris depuis le storage
   */
  private loadFavorites(): void {
    this.storageService.favorites$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(favorites => {
      this.recentFavorites = favorites;
    });
  }

  /**
   * Configure la gestion des erreurs
   */
  private setupErrorHandling(): void {
    this.errorService.globalError$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.errorMessage = error;
    });
  }

  /**
   * Charge la météo par défaut (géolocalisation ou ville par défaut)
   */
  private loadDefaultWeather(): void {
    // Essayer d'abord la géolocalisation
    if (navigator.geolocation) {
      this.getCurrentLocation();
    } else {
      // Fallback : charger une ville par défaut
      this.loadWeatherForCity('Paris');
    }
  }

  /**
   * Gère la sélection d'une ville depuis la SearchBar
   */
  onCitySelected(city: City): void {
    this.loadWeatherForCoordinates(city.lat, city.lon, city.name);
  }

  /**
   * Gère la soumission d'une recherche
   */
  onSearchSubmitted(cityName: string): void {
    this.loadWeatherForCity(cityName);
  }

  /**
   * Obtient la position actuelle de l'utilisateur
   */
  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.errorService.addError(
        'Géolocalisation non supportée',
        'warning',
        'Votre navigateur ne supporte pas la géolocalisation'
      );
      return;
    }

    this.isLoadingLocation = true;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.loadWeatherForCoordinates(latitude, longitude);
        this.isLoadingLocation = false;
      },
      (error) => {
        this.isLoadingLocation = false;
        this.errorService.handleGeolocationError(error);
        // Fallback vers Paris
        this.loadWeatherForCity('Paris');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }

  /**
   * Charge la météo pour une ville par nom
   */
  private loadWeatherForCity(cityName: string): void {
    this.isLoading = true;
    this.loadingMessage = `Recherche de ${cityName}...`;
    
    this.weatherService.getCurrentWeather(cityName).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (weather) => {
        this.currentWeather = weather;
        this.storageService.addToHistory(cityName, {
          lat: weather.coord.lat,
          lon: weather.coord.lon
        });
        this.isLoading = false;
        this.clearError();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorService.handleApiError(error, 'Recherche météo');
      }
    });
  }

  /**
   * Charge la météo pour des coordonnées
   */
  private loadWeatherForCoordinates(lat: number, lon: number, cityName?: string): void {
    this.isLoading = true;
    this.loadingMessage = cityName ? `Chargement de ${cityName}...` : 'Chargement...';
    
    this.weatherService.getWeatherByCoordinates(lat, lon).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (weather) => {
        this.currentWeather = weather;
        this.storageService.addToHistory(weather.name, { lat, lon });
        this.isLoading = false;
        this.clearError();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorService.handleApiError(error, 'Météo position');
      }
    });
  }

  /**
   * Gère l'ajout/suppression des favoris
   */
  onFavoriteToggled(event: { city: City; isFavorite: boolean }): void {
    if (event.isFavorite) {
      this.errorService.addError(
        'Ville ajoutée aux favoris',
        'info',
        `${event.city.name} a été ajoutée à vos favoris`
      );
    } else {
      this.errorService.addError(
        'Ville supprimée des favoris',
        'info',
        `${event.city.name} a été supprimée de vos favoris`
      );
    }
  }

  /**
   * Affiche les détails de la météo
   */
  onDetailsClick(weather: CurrentWeather): void {
    this.router.navigate(['/details'], {
      queryParams: {
        city: weather.name,
        lat: weather.coord.lat,
        lon: weather.coord.lon
      }
    });
  }

  /**
   * Affiche la ville sur la carte
   */
  onMapClick(weather: CurrentWeather): void {
    this.router.navigate(['/map'], {
      queryParams: {
        lat: weather.coord.lat,
        lon: weather.coord.lon,
        city: weather.name
      }
    });
  }

  /**
   * Gère le clic sur une carte de favori
   */
  onFavoriteCardClick(favorite: FavoriteCity): void {
    this.loadWeatherForCoordinates(
      favorite.city.lat,
      favorite.city.lon,
      favorite.city.name
    );
  }

  // ===== NAVIGATION =====

  navigateToForecast24h(): void {
    if (this.currentWeather) {
      this.router.navigate(['/forecast-24h'], {
        queryParams: {
          lat: this.currentWeather.coord.lat,
          lon: this.currentWeather.coord.lon,
          city: this.currentWeather.name
        }
      });
    }
  }

  navigateToForecast7days(): void {
    if (this.currentWeather) {
      this.router.navigate(['/forecast-7days'], {
        queryParams: {
          lat: this.currentWeather.coord.lat,
          lon: this.currentWeather.coord.lon,
          city: this.currentWeather.name
        }
      });
    }
  }

  navigateToMap(): void {
    if (this.currentWeather) {
      this.router.navigate(['/map'], {
        queryParams: {
          lat: this.currentWeather.coord.lat,
          lon: this.currentWeather.coord.lon,
          city: this.currentWeather.name
        }
      });
    } else {
      this.router.navigate(['/map']);
    }
  }

  navigateToFavorites(): void {
    this.router.navigate(['/favorites']);
  }

  // ===== GESTION DES ERREURS =====

  clearError(): void {
    this.errorMessage = null;
    this.errorService.clearGlobalError();
  }

  onErrorAction(error: AppError): void {
    if (error.actionCallback) {
      error.actionCallback();
    }
  }
}
