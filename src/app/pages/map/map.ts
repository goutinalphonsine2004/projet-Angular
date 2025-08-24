import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, switchMap, catchError, of, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';

// Services
import { WeatherService } from '../../services/weather.service';
import { MapService } from '../../services/map.service';
import { ErrorService, AppError } from '../../services/error.service';
import { environment } from '../../../environments/environment';

// Components
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { ErrorAlertComponent } from '../../components/error-alert/error-alert';

// Models
import { City, CurrentWeather } from '../../models/weather.model';

// Leaflet types
declare var L: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    ErrorAlertComponent
  ],
  templateUrl: './map.html',
  styleUrl: './map.scss'
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Map properties
  map: any = null;
  currentMarker: any = null;
  searchMarker: any = null;
  weatherMarkers: any[] = [];
  weatherLayerGroup: any = null;
  
  // Search properties
  searchControl = new FormControl('');
  searchResults: City[] = [];
  isSearching: boolean = false;
  
  // Weather data
  currentWeather: CurrentWeather | null = null;
  city: City | null = null;
  
  // Map controls
  isFullscreen: boolean = false;
  showWeatherLayers: boolean = true;
  showTemperatureLayer: boolean = true;
  showPrecipitationLayer: boolean = true;
  showWindLayer: boolean = true;
  showPressureLayer: boolean = true;
  showCloudsLayer: boolean = true;
  
  // Loading states
  isLoading: boolean = false;
  isLoadingLocation: boolean = false;
  errorMessage: AppError | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private mapService: MapService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupErrorHandling();
    this.setupSearch();
    this.loadMapFromRoute();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
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
   * Configure la recherche
   */
  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      if (searchTerm && searchTerm.length >= 2) {
        this.searchCities(searchTerm);
      } else {
        this.searchResults = [];
      }
    });
  }

  /**
   * Charge les paramètres de carte depuis la route
   */
  private loadMapFromRoute(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const lat = parseFloat(params['lat']);
      const lon = parseFloat(params['lon']);
      const cityName = params['city'];

      if (lat && lon) {
        this.city = {
          name: cityName || 'Position actuelle',
          lat,
          lon,
          country: params['country'] || ''
        };
        
        if (this.map) {
          this.centerMapOnCity(lat, lon);
          this.loadWeatherForCity(lat, lon);
        }
      }
    });
  }

  /**
   * Initialise la carte Leaflet
   */
  private initializeMap(): void {
    // Configuration de la carte
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [48.8566, 2.3522], // Paris par défaut
      zoom: 10,
      zoomControl: true,
      attributionControl: true
    });

    // Ajout des tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Groupe pour les marqueurs météo
    this.weatherLayerGroup = L.layerGroup().addTo(this.map);

    // Événements de la carte
    this.map.on('click', (e: any) => {
      this.onMapClick(e);
    });

    // Centrer sur la ville si spécifiée
    if (this.city) {
      this.centerMapOnCity(this.city.lat, this.city.lon);
      this.loadWeatherForCity(this.city.lat, this.city.lon);
    } else {
      // Essayer la géolocalisation
      this.getCurrentLocation();
    }

    // Ajouter les contrôles de couches météo
    this.addWeatherLayerControls();
  }

  /**
   * Ajoute les contrôles de couches météo
   */
  private addWeatherLayerControls(): void {
    const weatherControl = L.control.layers(null, null, {
      position: 'topright',
      collapsed: false
    });

    // Couche température
    if (this.showTemperatureLayer) {
      const tempLayer = this.createTemperatureLayer();
      weatherControl.addOverlay(tempLayer, 'Température');
    }

    // Couche précipitations
    if (this.showPrecipitationLayer) {
      const precipLayer = this.createPrecipitationLayer();
      weatherControl.addOverlay(precipLayer, 'Précipitations');
    }

    // Couche vent
    if (this.showWindLayer) {
      const windLayer = this.createWindLayer();
      weatherControl.addOverlay(windLayer, 'Vent');
    }

    // Couche pression
    if (this.showPressureLayer) {
      const pressureLayer = this.createPressureLayer();
      weatherControl.addOverlay(pressureLayer, 'Pression');
    }

    // Couche nuages
    if (this.showCloudsLayer) {
      const cloudsLayer = this.createCloudsLayer();
      weatherControl.addOverlay(cloudsLayer, 'Nuages');
    }

    weatherControl.addTo(this.map);
  }

  /**
   * Crée la couche de température
   */
  private createTemperatureLayer(): any {
                   return L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${environment.openWeatherMapApiKey}`, {
      opacity: 0.7,
      attribution: '© OpenWeatherMap'
    });
  }

  /**
   * Crée la couche de précipitations
   */
  private createPrecipitationLayer(): any {
                   return L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${environment.openWeatherMapApiKey}`, {
      opacity: 0.7,
      attribution: '© OpenWeatherMap'
    });
  }

  /**
   * Crée la couche de vent
   */
  private createWindLayer(): any {
                   return L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${environment.openWeatherMapApiKey}`, {
      opacity: 0.7,
      attribution: '© OpenWeatherMap'
    });
  }

  /**
   * Crée la couche de pression
   */
  private createPressureLayer(): any {
                   return L.tileLayer(`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${environment.openWeatherMapApiKey}`, {
      opacity: 0.7,
      attribution: '© OpenWeatherMap'
    });
  }

  /**
   * Crée la couche de nuages
   */
  private createCloudsLayer(): any {
                   return L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${environment.openWeatherMapApiKey}`, {
      opacity: 0.7,
      attribution: '© OpenWeatherMap'
    });
  }

  /**
   * Centre la carte sur une ville
   */
  private centerMapOnCity(lat: number, lon: number): void {
    if (this.map) {
      this.map.setView([lat, lon], 12);
      
      // Ajouter un marqueur de recherche
      if (this.searchMarker) {
        this.map.removeLayer(this.searchMarker);
      }
      
      this.searchMarker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'search-marker',
          html: '<i class="bi bi-search"></i>',
          iconSize: [30, 30]
        })
      }).addTo(this.map);
    }
  }

  /**
   * Charge la météo pour une ville
   */
  private loadWeatherForCity(lat: number, lon: number): void {
    this.isLoading = true;
    
    this.weatherService.getWeatherByCoordinates(lat, lon).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorService.handleApiError(error, 'Chargement météo carte');
        return of(null);
      })
    ).subscribe(weather => {
      if (weather) {
        this.currentWeather = weather;
        this.addWeatherMarker(weather);
        this.clearError();
      }
      this.isLoading = false;
    });
  }

  /**
   * Ajoute un marqueur météo sur la carte
   */
  private addWeatherMarker(weather: CurrentWeather): void {
    // Supprimer l'ancien marqueur météo
    if (this.currentMarker) {
      this.weatherLayerGroup.removeLayer(this.currentMarker);
    }

    // Créer le nouveau marqueur
    const temp = weather.main.temp;
    const iconClass = this.getTemperatureIconClass(temp);
    
    this.currentMarker = L.marker([weather.coord.lat, weather.coord.lon], {
      icon: L.divIcon({
        className: `weather-marker ${iconClass}`,
        html: `
          <div class="marker-content">
            <div class="temperature">${Math.round(temp)}°C</div>
            <div class="city">${weather.name}</div>
          </div>
        `,
        iconSize: [60, 40]
      })
    }).addTo(this.weatherLayerGroup);

    // Popup avec informations météo
    const popupContent = this.createWeatherPopup(weather);
    this.currentMarker.bindPopup(popupContent);

    // Événement de clic sur le marqueur
    this.currentMarker.on('click', () => {
      this.onWeatherMarkerClick(weather);
    });
  }

  /**
   * Crée le contenu du popup météo
   */
  private createWeatherPopup(weather: CurrentWeather): string {
    return `
      <div class="weather-popup">
        <h5>${weather.name}</h5>
        <div class="weather-info">
          <div class="temp-main">${Math.round(weather.main.temp)}°C</div>
          <div class="weather-desc">${weather.weather[0]?.description}</div>
          <div class="weather-details">
            <div>Humidité: ${weather.main.humidity}%</div>
            <div>Vent: ${Math.round(weather.wind.speed)} km/h</div>
            <div>Pression: ${weather.main.pressure} hPa</div>
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn btn-sm btn-primary" onclick="this.dispatchEvent(new CustomEvent('viewDetails', {detail: '${weather.name}'}))">
            Voir détails
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Obtient la classe CSS pour l'icône de température
   */
  private getTemperatureIconClass(temp: number): string {
    if (temp < 0) return 'temp-cold';
    if (temp < 15) return 'temp-cool';
    if (temp < 25) return 'temp-warm';
    if (temp < 35) return 'temp-hot';
    return 'temp-very-hot';
  }

  /**
   * Recherche des villes
   */
  private searchCities(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) return;

    this.isSearching = true;
    
    this.weatherService.searchCities(searchTerm).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorService.handleApiError(error, 'Recherche villes');
        return of([]);
      })
    ).subscribe(cities => {
      this.searchResults = cities.slice(0, 5); // Limiter à 5 résultats
      this.isSearching = false;
    });
  }

  /**
   * Gère la sélection d'une ville dans la recherche
   */
  onCitySelected(city: City): void {
    this.city = city;
    this.searchControl.setValue(city.name);
    this.searchResults = [];
    
    this.centerMapOnCity(city.lat, city.lon);
    this.loadWeatherForCity(city.lat, city.lon);
  }

  /**
   * Gère le clic sur la carte
   */
  onMapClick(event: any): void {
    const { lat, lng } = event.latlng;
    
    // Charger la météo pour ce point
    this.loadWeatherForCity(lat, lng);
    
    // Mettre à jour la ville
    this.city = {
      name: 'Position sélectionnée',
      lat,
      lon: lng,
      country: ''
    };
  }

  /**
   * Gère le clic sur un marqueur météo
   */
  onWeatherMarkerClick(weather: CurrentWeather): void {
    // Navigation vers la page de détails
    this.router.navigate(['/details'], {
      queryParams: {
        city: weather.name,
        lat: weather.coord.lat,
        lon: weather.coord.lon,
        country: weather.sys.country
      }
    });
  }

  /**
   * Obtient la position actuelle
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
        
        this.city = {
          name: 'Ma position',
          lat: latitude,
          lon: longitude,
          country: ''
        };
        
        this.centerMapOnCity(latitude, longitude);
        this.loadWeatherForCity(latitude, longitude);
        this.isLoadingLocation = false;
      },
      (error) => {
        this.isLoadingLocation = false;
        this.errorService.handleGeolocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }

  /**
   * Pointe sur une ville spécifique (comme Google Maps)
   */
  pointToCity(cityName: string): void {
    if (!cityName || cityName.trim().length < 2) {
      this.errorService.addError(
        'Nom de ville invalide',
        'warning',
        'Veuillez saisir un nom de ville valide (minimum 2 caractères)'
      );
      return;
    }

    this.isLoadingLocation = true;
    
    // Rechercher la ville
    this.weatherService.searchCities(cityName.trim()).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorService.handleApiError(error, 'Recherche ville');
        this.isLoadingLocation = false;
        return of([]);
      })
    ).subscribe(cities => {
      if (cities.length > 0) {
        // Prendre la première ville trouvée
        const city = cities[0];
        
        this.city = {
          name: city.name,
          lat: city.lat,
          lon: city.lon,
          country: city.country
        };
        
        // Centrer la carte sur la ville
        this.centerMapOnCity(city.lat, city.lon);
        
        // Charger la météo pour cette ville
        this.loadWeatherForCity(city.lat, city.lon);
        
        // Mettre à jour la barre de recherche
        this.searchControl.setValue(city.name);
        
        // Effacer les résultats de recherche
        this.searchResults = [];
        
        this.errorService.addError(
          'Ville trouvée !',
          'info',
          `${city.name}, ${city.country} a été localisée sur la carte`
        );
      } else {
        this.errorService.addError(
          'Ville non trouvée',
          'warning',
          `Aucune ville trouvée pour "${cityName}". Vérifiez l'orthographe.`
        );
      }
      
      this.isLoadingLocation = false;
    });
  }

  /**
   * Pointe sur des coordonnées GPS spécifiques
   */
  pointToCoordinates(lat: number, lon: number, cityName?: string): void {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      this.errorService.addError(
        'Coordonnées invalides',
        'warning',
        'Les coordonnées GPS doivent être valides (lat: -90 à 90, lon: -180 à 180)'
      );
      return;
    }

    this.city = {
      name: cityName || 'Position GPS',
      lat: lat,
      lon: lon,
      country: ''
    };
    
    // Centrer la carte sur les coordonnées
    this.centerMapOnCity(lat, lon);
    
    // Charger la météo pour cette position
    this.loadWeatherForCity(lat, lon);
    
    this.errorService.addError(
      'Position GPS !',
      'info',
      `Carte centrée sur ${cityName || `(${lat.toFixed(4)}, ${lon.toFixed(4)})`}`
    );
  }

  /**
   * Pointe sur une ville depuis les favoris
   */
  pointToFavoriteCity(favoriteCity: any): void {
    if (favoriteCity && favoriteCity.lat && favoriteCity.lon) {
      this.city = {
        name: favoriteCity.name || favoriteCity.city,
        lat: favoriteCity.lat,
        lon: favoriteCity.lon,
        country: favoriteCity.country || ''
      };
      
      // Centrer la carte sur la ville favorite
      this.centerMapOnCity(favoriteCity.lat, favoriteCity.lon);
      
      // Charger la météo pour cette ville
      this.loadWeatherForCity(favoriteCity.lat, favoriteCity.lon);
      
      // Mettre à jour la barre de recherche
      this.searchControl.setValue(this.city.name);
      
      this.errorService.addError(
        'Ville favorite !',
        'info',
        `${this.city.name} a été localisée depuis vos favoris`
      );
    }
  }

  /**
   * Bascule le mode plein écran
   */
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    
    if (this.isFullscreen) {
      this.mapContainer.nativeElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    
    // Redimensionner la carte
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  /**
   * Bascule l'affichage des couches météo
   */
  toggleWeatherLayers(): void {
    this.showWeatherLayers = !this.showWeatherLayers;
    
    if (this.showWeatherLayers) {
      this.addWeatherLayerControls();
    } else {
      // Supprimer les couches météo
      this.map.eachLayer((layer: any) => {
        if (layer.options && layer.options.attribution === '© OpenWeatherMap') {
          this.map.removeLayer(layer);
        }
      });
    }
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
      this.loadWeatherForCity(this.city.lat, this.city.lon);
    }
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
}
