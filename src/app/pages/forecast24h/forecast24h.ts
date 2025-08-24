import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, switchMap, catchError, of } from 'rxjs';

// Services
import { WeatherService } from '../../services/weather.service';
import { ErrorService, AppError } from '../../services/error.service';

// Components
import { ForecastChartComponent } from '../../components/forecast-chart/forecast-chart';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { ErrorAlertComponent } from '../../components/error-alert/error-alert';

// Models
import { ForecastItem, City } from '../../models/weather.model';

@Component({
  selector: 'app-forecast24h',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ForecastChartComponent,
    LoadingSpinnerComponent,
    ErrorAlertComponent
  ],
  templateUrl: './forecast24h.html',
  styleUrl: './forecast24h.scss'
})
export class Forecast24hComponent implements OnInit, OnDestroy {
  @ViewChild(ForecastChartComponent) chartComponent!: ForecastChartComponent;

  hourlyForecast: ForecastItem[] = [];
  city: City | null = null;
  isLoading: boolean = false;
  errorMessage: AppError | null = null;
  
  // Données pour le graphique
  chartData: any = null;
  chartOptions: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupErrorHandling();
    this.loadForecastFromRoute();
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
   * Charge les prévisions depuis les paramètres de route
   */
  private loadForecastFromRoute(): void {
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

        return this.weatherService.getForecast24h(lat, lon);
      }),
      catchError(error => {
        this.errorService.handleApiError(error, 'Chargement prévisions 24h');
        return of(null);
      })
    ).subscribe(forecast => {
      if (forecast) {
        this.hourlyForecast = forecast.list;
        this.prepareChartData();
        this.clearError();
      }
    });
  }

  /**
   * Prépare les données pour le graphique
   */
  private prepareChartData(): void {
    if (!this.hourlyForecast.length) return;

    // Créer un objet ForecastResponse compatible avec le composant
    this.chartData = {
      list: this.hourlyForecast,
      city: {
        name: this.city?.name || '',
        country: this.city?.country || '',
        coord: {
          lat: this.city?.lat || 0,
          lon: this.city?.lon || 0
        }
      }
    };
  }

  /**
   * Formate l'heure pour l'affichage
   */
  formatHour(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
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
      month: 'long' 
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

  // ===== NAVIGATION =====

  navigateToHome(): void {
    this.router.navigate(['/']);
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

  navigateToDetails(): void {
    if (this.city) {
      this.router.navigate(['/details'], {
        queryParams: {
          city: this.city.name,
          lat: this.city.lat,
          lon: this.city.lon,
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
   * Recharge les prévisions
   */
  reloadForecast(): void {
    if (this.city) {
      this.loadForecastFromRoute();
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * TrackBy pour la grille des prévisions
   */
  trackByHour(index: number, hour: ForecastItem): number {
    return hour.dt;
  }

  /**
   * Obtient la température minimale
   */
  getMinTemperature(): number {
    if (!this.hourlyForecast.length) return 0;
    return Math.min(...this.hourlyForecast.map(hour => hour.main.temp));
  }

  /**
   * Obtient la température maximale
   */
  getMaxTemperature(): number {
    if (!this.hourlyForecast.length) return 0;
    return Math.max(...this.hourlyForecast.map(hour => hour.main.temp));
  }

  /**
   * Obtient la température moyenne
   */
  getAverageTemperature(): number {
    if (!this.hourlyForecast.length) return 0;
    const sum = this.hourlyForecast.reduce((acc, hour) => acc + hour.main.temp, 0);
    return sum / this.hourlyForecast.length;
  }

  /**
   * Obtient la vitesse du vent maximale
   */
  getMaxWindSpeed(): number {
    if (!this.hourlyForecast.length) return 0;
    return Math.max(...this.hourlyForecast.map(hour => hour.wind.speed));
  }

  /**
   * Obtient l'humidité moyenne
   */
  getAverageHumidity(): number {
    if (!this.hourlyForecast.length) return 0;
    const sum = this.hourlyForecast.reduce((acc, hour) => acc + hour.main.humidity, 0);
    return Math.round(sum / this.hourlyForecast.length);
  }

  /**
   * Obtient le total des précipitations
   */
  getTotalPrecipitation(): number {
    if (!this.hourlyForecast.length) return 0;
    const sum = this.hourlyForecast.reduce((acc, hour) => acc + hour.pop, 0);
    return Math.round((sum / this.hourlyForecast.length) * 100);
  }
}
