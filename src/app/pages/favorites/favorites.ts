import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, switchMap, catchError, of, debounceTime, distinctUntilChanged } from 'rxjs';

// Services
import { WeatherService } from '../../services/weather.service';
import { StorageService, FavoriteCity, SearchHistory } from '../../services/storage.service';
import { ErrorService, AppError } from '../../services/error.service';

// Components
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { ErrorAlertComponent } from '../../components/error-alert/error-alert';

// Models
import { CurrentWeather, City } from '../../models/weather.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
    ErrorAlertComponent
  ],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss'
})
export class FavoritesComponent implements OnInit, OnDestroy {
  // Favoris
  favorites: FavoriteCity[] = [];
  favoriteWeather: Map<string, CurrentWeather> = new Map();
  
  // Historique
  history: FavoriteCity[] = [];
  historyWeather: Map<string, CurrentWeather> = new Map();
  
  // États
  isLoading: boolean = false;
  isLoadingFavorites: boolean = false;
  isLoadingHistory: boolean = false;
  errorMessage: AppError | null = null;
  
  // Filtres et recherche
  searchTerm: string = '';
  activeTab: 'favorites' | 'history' = 'favorites';
  sortBy: 'name' | 'date' | 'temperature' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private storageService: StorageService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupErrorHandling();
    this.loadFavorites();
    this.loadHistory();
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
   * Charge les favoris depuis le storage
   */
  private loadFavorites(): void {
    this.isLoadingFavorites = true;
    
    this.storageService.favorites$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(favorites => {
      this.favorites = favorites;
      this.loadWeatherForFavorites();
      this.isLoadingFavorites = false;
    });
  }

    /**
   * Charge l'historique depuis le storage
   */
  private loadHistory(): void {
    this.isLoadingHistory = true;

    this.storageService.history$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(searchHistory => {
      // Convertir SearchHistory en FavoriteCity
      this.history = searchHistory.map(item => ({
        city: {
          name: item.city,
          lat: item.coordinates?.lat || 0,
          lon: item.coordinates?.lon || 0,
          country: ''
        },
        lastUpdate: item.timestamp,
        lastVisited: item.timestamp,
        weather: undefined
      }));
      this.loadWeatherForHistory();
      this.isLoadingHistory = false;
    });
  }

  /**
   * Charge la météo pour tous les favoris
   */
  private loadWeatherForFavorites(): void {
    this.favorites.forEach(favorite => {
      this.loadWeatherForCity(favorite.city, 'favorites');
    });
  }

  /**
   * Charge la météo pour l'historique
   */
  private loadWeatherForHistory(): void {
    this.history.forEach(historyItem => {
      this.loadWeatherForCity(historyItem.city, 'history');
    });
  }

  /**
   * Charge la météo pour une ville spécifique
   */
  private loadWeatherForCity(city: City, type: 'favorites' | 'history'): void {
    this.weatherService.getWeatherByCoordinates(city.lat, city.lon).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.warn(`Impossible de charger la météo pour ${city.name}:`, error);
        return of(null);
      })
    ).subscribe(weather => {
      if (weather) {
        if (type === 'favorites') {
          this.favoriteWeather.set(city.name, weather);
        } else {
          this.historyWeather.set(city.name, weather);
        }
      }
    });
  }

  /**
   * Gère la suppression d'un favori
   */
  removeFavorite(favorite: FavoriteCity): void {
    this.storageService.removeFavorite(favorite);
    
    this.errorService.addError(
      'Favori supprimé',
      'info',
      `${favorite.city.name} a été supprimé de vos favoris`
    );
  }

  /**
   * Gère la suppression d'un élément de l'historique
   */
  removeHistoryItem(historyItem: FavoriteCity): void {
    this.storageService.removeFromHistory(historyItem.city.name);
    
    this.errorService.addError(
      'Historique supprimé',
      'info',
      `${historyItem.city.name} a été supprimé de l'historique`
    );
  }

  /**
   * Gère le clic sur une ville
   */
  onCityClick(city: City): void {
    this.router.navigate(['/details'], {
      queryParams: {
        city: city.name,
        lat: city.lat,
        lon: city.lon,
        country: city.country
      }
    });
  }

  /**
   * Gère la navigation vers les prévisions 24h
   */
  navigateToForecast24h(city?: City): void {
    if (city) {
      this.router.navigate(['/forecast-24h'], {
        queryParams: {
          lat: city.lat,
          lon: city.lon,
          city: city.name,
          country: city.country
        }
      });
    } else {
      this.router.navigate(['/forecast-24h']);
    }
  }

  /**
   * Gère la navigation vers les prévisions 7 jours
   */
  navigateToForecast7days(city?: City): void {
    if (city) {
      this.router.navigate(['/forecast-7days'], {
        queryParams: {
          lat: city.lat,
          lon: city.lon,
          city: city.name,
          country: city.country
        }
      });
    } else {
      this.router.navigate(['/forecast-7days']);
    }
  }

  /**
   * Gère la navigation vers la carte
   */
  navigateToMap(city?: City): void {
    if (city) {
      this.router.navigate(['/map'], {
        queryParams: {
          lat: city.lat,
          lon: city.lon,
          city: city.name
        }
      });
    } else {
      this.router.navigate(['/map']);
    }
  }

  /**
   * Gère la navigation vers l'accueil
   */
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Bascule entre les onglets
   */
  setActiveTab(tab: 'favorites' | 'history'): void {
    this.activeTab = tab;
  }

  /**
   * Change le tri
   */
  changeSort(sortBy: 'name' | 'date' | 'temperature'): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
  }

  /**
   * Obtient les éléments triés selon les critères actuels
   */
  getSortedItems(): FavoriteCity[] {
    const items = this.activeTab === 'favorites' ? this.favorites : this.history;
    
    if (!this.sortBy) return items;
    
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.city.name.localeCompare(b.city.name);
          break;
        case 'date':
          const aTime = a.lastVisited ? new Date(a.lastVisited).getTime() : 0;
          const bTime = b.lastVisited ? new Date(b.lastVisited).getTime() : 0;
          comparison = aTime - bTime;
          break;
        case 'temperature':
          const weatherA = this.getWeatherForCity(a.city.name);
          const weatherB = this.getWeatherForCity(b.city.name);
          
          if (weatherA && weatherB) {
            comparison = weatherA.main.temp - weatherB.main.temp;
          } else {
            comparison = 0;
          }
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Obtient la météo pour une ville
   */
  getWeatherForCity(cityName: string): CurrentWeather | null {
    return this.favoriteWeather.get(cityName) || this.historyWeather.get(cityName) || null;
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
   * Obtient l'icône météo appropriée
   */
  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

    /**
   * Formate la date de dernière visite
   */
  formatLastVisited(timestamp: number | undefined): string {
    if (!timestamp) return 'Jamais visité';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  }

  /**
   * Obtient les éléments filtrés par recherche
   */
  getFilteredItems(): FavoriteCity[] {
    const items = this.getSortedItems();
    
    if (!this.searchTerm) return items;
    
    return items.filter(item => 
      item.city.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      item.city.country.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  /**
   * Vide tous les favoris
   */
  clearAllFavorites(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous vos favoris ?')) {
      this.storageService.clearFavorites();
      
      this.errorService.addError(
        'Favoris supprimés',
        'info',
        'Tous vos favoris ont été supprimés'
      );
    }
  }

  /**
   * Vide tout l'historique
   */
  clearAllHistory(): void {
    if (confirm('Êtes-vous sûr de vouloir vider tout l\'historique ?')) {
      this.storageService.clearHistory();
      
      this.errorService.addError(
        'Historique vidé',
        'info',
        'Tout l\'historique a été supprimé'
      );
    }
  }

  /**
   * Recharge la météo pour tous les éléments
   */
  refreshAllWeather(): void {
    this.isLoading = true;
    
    // Recharger favoris
    this.loadWeatherForFavorites();
    
    // Recharger historique
    this.loadWeatherForHistory();
    
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
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
