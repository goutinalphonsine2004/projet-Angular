import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, switchMap, catchError, of } from 'rxjs';

// Services
import { WeatherService } from '../../services/weather.service';
import { ErrorService, AppError } from '../../services/error.service';

// Components
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { ErrorAlertComponent } from '../../components/error-alert/error-alert';

// Models
import { CurrentWeather, City } from '../../models/weather.model';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    ErrorAlertComponent
  ],
  templateUrl: './details.html',
  styleUrl: './details.scss'
})
export class DetailsComponent implements OnInit, OnDestroy {
  currentWeather: CurrentWeather | null = null;
  city: City | null = null;
  isLoading: boolean = false;
  errorMessage: AppError | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupErrorHandling();
    this.loadWeatherFromRoute();
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
      this.errorMessage = error;
    });
  }

  /**
   * Charge la météo depuis les paramètres de route
   */
  private loadWeatherFromRoute(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const lat = parseFloat(params['lat']);
        const lon = parseFloat(params['lon']);
        const cityName = params['city'];

        if (!lat || !lon) {
          throw new Error('Coordonnées manquantes');
        }

        this.city = {
          name: cityName || 'Position actuelle',
          lat,
          lon,
          country: params['country'] || ''
        };

        return this.weatherService.getWeatherByCoordinates(lat, lon);
      }),
      catchError(error => {
        this.errorService.handleApiError(error, 'Chargement détails météo');
        return of(null);
      })
    ).subscribe(weather => {
      if (weather) {
        this.currentWeather = weather;
        this.clearError();
      }
    });
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Formate l'heure pour l'affichage
   */
  formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Obtient l'icône météo appropriée
   */
  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  /**
   * Obtient la classe CSS pour la température
   */
  getTemperatureClass(temp: number): string {
    if (temp < 0) return 'text-primary';
    if (temp < 15) return 'text-info';
    if (temp < 25) return 'text-success';
    if (temp < 35) return 'text-warning';
    return 'text-danger';
  }

  /**
   * Obtient la classe CSS pour l'humidité
   */
  getHumidityClass(humidity: number): string {
    if (humidity < 30) return 'text-danger';
    if (humidity < 60) return 'text-warning';
    return 'text-success';
  }

  /**
   * Obtient la classe CSS pour le vent
   */
  getWindClass(speed: number): string {
    if (speed < 10) return 'text-success';
    if (speed < 25) return 'text-warning';
    return 'text-danger';
  }

  /**
   * Obtient la direction du vent en degrés
   */
  getWindDirection(deg: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  /**
   * Obtient la classe CSS pour la pression
   */
  getPressureClass(pressure: number): string {
    if (pressure < 1000) return 'text-danger';
    if (pressure < 1013) return 'text-warning';
    return 'text-success';
  }

  /**
   * Obtient la classe CSS pour la visibilité
   */
  getVisibilityClass(visibility: number): string {
    const visibilityKm = visibility / 1000;
    if (visibilityKm < 5) return 'text-danger';
    if (visibilityKm < 10) return 'text-warning';
    return 'text-success';
  }

  /**
   * Obtient la classe CSS pour l'index UV
   */
  getUvClass(uvi: number): string {
    if (uvi < 3) return 'text-success';
    if (uvi < 6) return 'text-warning';
    if (uvi < 8) return 'text-orange';
    return 'text-danger';
  }

  /**
   * Obtient la description de l'index UV
   */
  getUvDescription(uvi: number): string {
    if (uvi < 3) return 'Faible';
    if (uvi < 6) return 'Modéré';
    if (uvi < 8) return 'Élevé';
    if (uvi < 11) return 'Très élevé';
    return 'Extrême';
  }

  /**
   * Obtient la classe CSS pour la couverture nuageuse
   */
  getCloudClass(clouds: number): string {
    if (clouds < 20) return 'text-success';
    if (clouds < 60) return 'text-warning';
    return 'text-info';
  }

  /**
   * Obtient la description de la couverture nuageuse
   */
  getCloudDescription(clouds: number): string {
    if (clouds < 20) return 'Ciel dégagé';
    if (clouds < 40) return 'Peu nuageux';
    if (clouds < 60) return 'Partiellement nuageux';
    if (clouds < 80) return 'Nuageux';
    return 'Très nuageux';
  }

  /**
   * Obtient la classe CSS pour la qualité de l'air
   */
  getAirQualityClass(aqi: number): string {
    if (aqi <= 50) return 'text-success';
    if (aqi <= 100) return 'text-warning';
    if (aqi <= 150) return 'text-orange';
    if (aqi <= 200) return 'text-danger';
    if (aqi <= 300) return 'text-purple';
    return 'text-danger';
  }

  /**
   * Obtient la description de la qualité de l'air
   */
  getAirQualityDescription(aqi: number): string {
    if (aqi <= 50) return 'Bonne';
    if (aqi <= 100) return 'Modérée';
    if (aqi <= 150) return 'Mauvaise pour groupes sensibles';
    if (aqi <= 200) return 'Mauvaise';
    if (aqi <= 300) return 'Très mauvaise';
    return 'Dangereuse';
  }

  // ===== NAVIGATION =====

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToForecast24h(): void {
    if (this.city) {
      this.router.navigate(['/forecast-24h'], {
        queryParams: {
          lat: this.city.lat,
          lon: this.city.lon,
          city: this.city.name,
          country: this.city.country
        }
      });
    }
  }

  navigateToForecast7days(): void {
    if (this.city) {
      this.router.navigate(['/forecast-7days'], {
        queryParams: {
          lat: this.city.lat,
          lon: this.city.lon,
          city: this.city.name,
          country: this.city.country
        }
      });
    }
  }

  navigateToMap(): void {
    if (this.city) {
      this.router.navigate(['/map'], {
        queryParams: {
          lat: this.city.lat,
          lon: this.city.lon,
          city: this.city.name
        }
      });
    } else {
      this.router.navigate(['/map']);
    }
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

  /**
   * Recharge la météo
   */
  reloadWeather(): void {
    if (this.city) {
      this.loadWeatherFromRoute();
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Obtient la température ressentie en texte
   */
  getFeelsLikeText(temp: number, feelsLike: number): string {
    const diff = feelsLike - temp;
    if (Math.abs(diff) < 2) return 'Similaire à la température réelle';
    if (diff > 2) return 'Plus chaud que la température réelle';
    return 'Plus froid que la température réelle';
  }

  /**
   * Obtient la description du vent
   */
  getWindDescription(speed: number): string {
    if (speed < 5) return 'Vent léger';
    if (speed < 15) return 'Vent modéré';
    if (speed < 25) return 'Vent fort';
    if (speed < 35) return 'Vent très fort';
    return 'Vent violent';
  }

  /**
   * Obtient la description de la pression
   */
  getPressureDescription(pressure: number): string {
    if (pressure < 1000) return 'Pression basse (dépression)';
    if (pressure < 1013) return 'Pression légèrement basse';
    if (pressure < 1020) return 'Pression normale';
    return 'Pression élevée (anticyclone)';
  }

  /**
   * Obtient la description de la visibilité
   */
  getVisibilityDescription(visibility: number): string {
    const visibilityKm = visibility / 1000;
    if (visibilityKm < 1) return 'Visibilité très réduite';
    if (visibilityKm < 5) return 'Visibilité réduite';
    if (visibilityKm < 10) return 'Visibilité modérée';
    return 'Bonne visibilité';
  }

  /**
   * Obtient la description de l'humidité
   */
  getHumidityDescription(humidity: number): string {
    if (humidity < 30) return 'Air très sec';
    if (humidity < 50) return 'Air sec';
    if (humidity < 70) return 'Air confortable';
    if (humidity < 90) return 'Air humide';
    return 'Air très humide';
  }

  /**
   * Obtient la description de la température
   */
  getTemperatureDescription(temp: number): string {
    if (temp < -10) return 'Très froid';
    if (temp < 0) return 'Froid';
    if (temp < 15) return 'Fraîche';
    if (temp < 25) return 'Agréable';
    if (temp < 35) return 'Chaude';
    return 'Très chaude';
  }

  /**
   * Calcule la durée du jour
   */
  getDayDuration(sunrise: number, sunset: number): string {
    const duration = sunset - sunrise;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Obtient l'offset du fuseau horaire
   */
  getTimezoneOffset(timezone: number): string {
    const hours = Math.floor(timezone / 3600);
    const minutes = Math.floor((timezone % 3600) / 60);
    const sign = hours >= 0 ? '+' : '-';
    return `${sign}${Math.abs(hours).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
