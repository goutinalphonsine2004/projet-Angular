import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentWeather, City } from '../../models/weather.model';
import { WeatherService } from '../../services/weather.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-card.html',
  styleUrls: ['./weather-card.scss']
})
export class WeatherCardComponent implements OnInit, OnChanges {
  @Input() weather: CurrentWeather | null = null;
  @Input() city: City | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showHeader: boolean = true;
  @Input() showDetails: boolean = true;
  @Input() showFeelsLike: boolean = true;
  @Input() showTimestamp: boolean = true;
  @Input() showFavoriteButton: boolean = true;
  @Input() showActions: boolean = false;
  @Input() isLoading: boolean = false;

  @Output() favoriteToggled = new EventEmitter<{ city: City; isFavorite: boolean }>();
  @Output() detailsClick = new EventEmitter<CurrentWeather>();
  @Output() mapClick = new EventEmitter<CurrentWeather>();
  @Output() shareClick = new EventEmitter<CurrentWeather>();
  @Output() cardClick = new EventEmitter<CurrentWeather>();

  isFavorite: boolean = false;
  showActionsDropdown: boolean = false;

  constructor(
    private weatherService: WeatherService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.checkFavoriteStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weather'] || changes['city']) {
      this.checkFavoriteStatus();
    }
  }

  /**
   * Vérifie si cette ville est dans les favoris
   */
  private checkFavoriteStatus(): void {
    if (this.weather && this.weather.name && this.weather.sys?.country) {
      this.isFavorite = this.storageService.isFavorite(
        this.weather.name,
        this.weather.sys.country
      );
    } else if (this.city) {
      this.isFavorite = this.storageService.isFavorite(
        this.city.name,
        this.city.country
      );
    }
  }

  /**
   * Bascule le statut de favori
   */
  toggleFavorite(): void {
    if (!this.weather && !this.city) return;

    const cityToToggle = this.city || {
      name: this.weather!.name,
      lat: this.weather!.coord.lat,
      lon: this.weather!.coord.lon,
      country: this.weather!.sys?.country || ''
    };

    if (this.isFavorite) {
      const success = this.storageService.removeFromFavorites(
        cityToToggle.name,
        cityToToggle.country
      );
      if (success) {
        this.isFavorite = false;
        this.favoriteToggled.emit({ city: cityToToggle, isFavorite: false });
      }
    } else {
      const success = this.storageService.addToFavorites(cityToToggle, this.weather || undefined);
      if (success) {
        this.isFavorite = true;
        this.favoriteToggled.emit({ city: cityToToggle, isFavorite: true });
      }
    }
  }

  /**
   * Formate la température
   */
  formatTemperature(temp: number): string {
    return this.weatherService.formatTemperature(temp);
  }

  /**
   * Formate la vitesse du vent
   */
  formatWindSpeed(speed: number | undefined): string {
    if (!speed) return 'N/A';
    return this.weatherService.formatWindSpeed(speed);
  }

  /**
   * Retourne l'URL de l'icône météo
   */
  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  /**
   * Vérifie le type de météo pour le styling
   */
  isWeatherType(type: string): boolean {
    if (!this.weather?.weather?.[0]) return false;

    const mainWeather = this.weather.weather[0].main.toLowerCase();

    switch (type) {
      case 'clear':
        return mainWeather === 'clear';
      case 'clouds':
        return mainWeather === 'clouds';
      case 'rain':
        return mainWeather === 'rain' || mainWeather === 'drizzle';
      case 'snow':
        return mainWeather === 'snow';
      case 'thunderstorm':
        return mainWeather === 'thunderstorm';
      default:
        return false;
    }
  }

  /**
   * Formate le temps de mise à jour
   */
  getUpdateTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Gestionnaires d'événements
   */
  onDetailsClick(): void {
    if (this.weather) {
      this.detailsClick.emit(this.weather);
    }
  }

  onMapClick(): void {
    if (this.weather) {
      this.mapClick.emit(this.weather);
    }
  }

  onShareClick(): void {
    if (this.weather) {
      this.shareClick.emit(this.weather);

      // Implémentation native du partage si disponible
      if (navigator.share) {
        navigator.share({
          title: `Météo à ${this.weather.name}`,
          text: `${this.formatTemperature(this.weather.main.temp)} - ${this.weather.weather[0]?.description}`,
          url: window.location.href
        }).catch(console.error);
      }
    }
  }

  onCardClick(): void {
    if (this.weather) {
      this.cardClick.emit(this.weather);
    }
  }

  toggleActionsMenu(): void {
    this.showActionsDropdown = !this.showActionsDropdown;
  }
}
