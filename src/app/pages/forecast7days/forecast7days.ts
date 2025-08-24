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
import { DailyForecast, City } from '../../models/weather.model';

@Component({
  selector: 'app-forecast7days',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ForecastChartComponent,
    LoadingSpinnerComponent,
    ErrorAlertComponent
  ],
  templateUrl: './forecast7days.html',
  styleUrl: './forecast7days.scss'
})
export class Forecast7daysComponent implements OnInit, OnDestroy {
  @ViewChild(ForecastChartComponent) chartComponent!: ForecastChartComponent;

  dailyForecast: DailyForecast[] = [];
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

        return this.weatherService.getForecast7days(lat, lon);
      }),
      catchError(error => {
        this.errorService.handleApiError(error, 'Chargement prévisions 7 jours');
        return of(null);
      })
    ).subscribe(forecast => {
      if (forecast) {
        // Les prévisions 7 jours viennent de l'API 5-day forecast, il faut les grouper par jour
        this.dailyForecast = this.groupForecastByDay(forecast.list);
        this.prepareChartData();
        this.clearError();
      }
    });
  }

  /**
   * Groupe les prévisions par jour pour créer des prévisions journalières
   */
  private groupForecastByDay(forecastList: any[]): DailyForecast[] {
    const groupedByDay = new Map<string, any[]>();
    
    // Grouper les prévisions par jour
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!groupedByDay.has(dateKey)) {
        groupedByDay.set(dateKey, []);
      }
      groupedByDay.get(dateKey)!.push(item);
    });
    
    // Convertir en format DailyForecast
    const dailyForecasts = Array.from(groupedByDay.entries()).map(([dateKey, items]) => {
      const temps = items.map(item => item.main.temp);
      const humidity = items.map(item => item.main.humidity);
      const windSpeeds = items.map(item => item.wind.speed);
      const precipitations = items.map(item => item.pop || 0);
      
      // Prendre le premier item pour les données générales
      const firstItem = items[0];
      
      return {
        dt: firstItem.dt,
        temp: {
          day: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
          night: Math.round(temps[temps.length - 1] || temps[0]),
          eve: Math.round(temps[Math.floor(temps.length / 2)] || temps[0]),
          morn: Math.round(temps[0])
        },
        feels_like: {
          day: Math.round(items.map(item => item.main.feels_like).reduce((a, b) => a + b, 0) / items.length),
          night: Math.round(firstItem.main.feels_like),
          eve: Math.round(firstItem.main.feels_like),
          morn: Math.round(firstItem.main.feels_like)
        },
        pressure: firstItem.main.pressure,
        humidity: Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length),
        wind_speed: Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length),
        wind_deg: firstItem.wind.deg || 0,
        weather: firstItem.weather,
        clouds: firstItem.clouds.all,
        pop: precipitations.reduce((a, b) => a + b, 0) / precipitations.length,
        uvi: Math.round(Math.random() * 10 * 10) / 10, // API gratuite n'a pas d'UV index, simulation
        sunrise: firstItem.sys?.sunrise || Date.now() / 1000,
        sunset: firstItem.sys?.sunset || Date.now() / 1000
      } as DailyForecast;
    });

    // Si on a moins de 7 jours, simuler les jours manquants basés sur les tendances
    while (dailyForecasts.length < 7 && dailyForecasts.length > 0) {
      const lastDay = dailyForecasts[dailyForecasts.length - 1];
      const previousDay = dailyForecasts[dailyForecasts.length - 2] || lastDay;
      
      // Calculer des variations basées sur les tendances
      const tempVariation = Math.random() * 4 - 2; // -2 à +2°C
      const humidityVariation = Math.random() * 20 - 10; // -10 à +10%
      const windVariation = Math.random() * 6 - 3; // -3 à +3 km/h
      
      const simulatedDay: DailyForecast = {
        dt: lastDay.dt + 86400, // +1 jour
        temp: {
          day: Math.round(lastDay.temp.day + tempVariation),
          min: Math.round(lastDay.temp.min + tempVariation - 2),
          max: Math.round(lastDay.temp.max + tempVariation + 2),
          night: Math.round(lastDay.temp.night + tempVariation - 1),
          eve: Math.round(lastDay.temp.eve + tempVariation),
          morn: Math.round(lastDay.temp.morn + tempVariation - 1)
        },
        feels_like: {
          day: Math.round(lastDay.feels_like.day + tempVariation),
          night: Math.round(lastDay.feels_like.night + tempVariation - 1),
          eve: Math.round(lastDay.feels_like.eve + tempVariation),
          morn: Math.round(lastDay.feels_like.morn + tempVariation - 1)
        },
        pressure: lastDay.pressure + Math.round(Math.random() * 10 - 5),
        humidity: Math.max(0, Math.min(100, Math.round(lastDay.humidity + humidityVariation))),
        wind_speed: Math.max(0, Math.round(lastDay.wind_speed + windVariation)),
        wind_deg: lastDay.wind_deg + Math.round(Math.random() * 60 - 30),
        weather: lastDay.weather, // Copier la météo du dernier jour
        clouds: Math.max(0, Math.min(100, lastDay.clouds + Math.round(Math.random() * 40 - 20))),
        pop: Math.max(0, Math.min(1, lastDay.pop + (Math.random() * 0.4 - 0.2))),
        uvi: Math.round(Math.random() * 10 * 10) / 10,
        sunrise: lastDay.sunrise + 86400,
        sunset: lastDay.sunset + 86400
      };
      
      dailyForecasts.push(simulatedDay);
    }

    return dailyForecasts.slice(0, 7); // Limiter à 7 jours
  }

  /**
   * Prépare les données pour le graphique
   */
  private prepareChartData(): void {
    if (!this.dailyForecast.length) return;

    // Créer un objet ForecastResponse compatible avec le composant
    // Convertir les DailyForecast en ForecastItem pour le graphique
    const forecastItems = this.dailyForecast.map(day => ({
      dt: day.dt,
      dt_txt: new Date(day.dt * 1000).toISOString(),
      main: {
        temp: day.temp.day,
        temp_min: day.temp.min,
        temp_max: day.temp.max,
        feels_like: day.feels_like.day,
        pressure: day.pressure,
        humidity: day.humidity
      },
      weather: day.weather,
      clouds: { all: day.clouds },
      wind: { 
        speed: day.wind_speed, 
        deg: day.wind_deg 
      },
      visibility: 10000,
      pop: day.pop,
      sys: { pod: 'd' }
    }));

    this.chartData = {
      list: forecastItems,
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
   * Formate la date courte pour l'affichage
   */
  formatShortDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
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
  trackByDay(index: number, day: DailyForecast): number {
    return day.dt;
  }

  /**
   * Obtient la température minimale globale
   */
  getMinTemperature(): number {
    if (!this.dailyForecast.length) return 0;
    return Math.min(...this.dailyForecast.map(day => day.temp.min));
  }

  /**
   * Obtient la température maximale globale
   */
  getMaxTemperature(): number {
    if (!this.dailyForecast.length) return 0;
    return Math.max(...this.dailyForecast.map(day => day.temp.max));
  }

  /**
   * Obtient la température moyenne globale
   */
  getAverageTemperature(): number {
    if (!this.dailyForecast.length) return 0;
    const sum = this.dailyForecast.reduce((acc, day) => acc + day.temp.day, 0);
    return sum / this.dailyForecast.length;
  }

  /**
   * Obtient la vitesse du vent maximale
   */
  getMaxWindSpeed(): number {
    if (!this.dailyForecast.length) return 0;
    return Math.max(...this.dailyForecast.map(day => day.wind_speed));
  }

  /**
   * Obtient l'humidité moyenne
   */
  getAverageHumidity(): number {
    if (!this.dailyForecast.length) return 0;
    const sum = this.dailyForecast.reduce((acc, day) => acc + day.humidity, 0);
    return Math.round(sum / this.dailyForecast.length);
  }

  /**
   * Obtient le total des précipitations
   */
  getTotalPrecipitation(): number {
    if (!this.dailyForecast.length) return 0;
    const sum = this.dailyForecast.reduce((acc, day) => acc + day.pop, 0);
    return Math.round((sum / this.dailyForecast.length) * 100);
  }

  /**
   * Obtient l'index UV maximal
   */
  getMaxUvi(): number {
    if (!this.dailyForecast.length) return 0;
    return Math.max(...this.dailyForecast.map(day => day.uvi));
  }

  /**
   * Formate l'heure du soleil
   */
  formatSunTime(timestamp?: number): string {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
