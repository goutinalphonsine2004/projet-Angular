import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { City, CurrentWeather } from '../models/weather.model';

export interface MapMarker {
  id: string;
  city: City;
  weather: CurrentWeather;
  position: [number, number]; // [lat, lng]
}

export interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: any = null;
  private markers: Map<string, any> = new Map();
  private weatherLayers: Map<string, any> = new Map();
  
  private markersSubject = new BehaviorSubject<MapMarker[]>([]);
  private centerSubject = new BehaviorSubject<[number, number]>([46.603354, 1.888334]); // France par défaut
  
  public markers$ = this.markersSubject.asObservable();
  public center$ = this.centerSubject.asObservable();

  // Couches météo OpenWeatherMap (gratuites)
  private readonly weatherLayersConfig: MapLayer[] = [
    {
      id: 'clouds',
      name: 'Nuages',
      url: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png',
      attribution: '© OpenWeatherMap',
      visible: false
    },
    {
      id: 'precipitation',
      name: 'Précipitations',
      url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png',
      attribution: '© OpenWeatherMap',
      visible: false
    },
    {
      id: 'pressure',
      name: 'Pression',
      url: 'https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png',
      attribution: '© OpenWeatherMap',
      visible: false
    },
    {
      id: 'wind',
      name: 'Vent',
      url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png',
      attribution: '© OpenWeatherMap',
      visible: false
    },
    {
      id: 'temp',
      name: 'Température',
      url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png',
      attribution: '© OpenWeatherMap',
      visible: false
    }
  ];

  constructor() {}

  /**
   * Initialise la carte Leaflet
   */
  initializeMap(containerId: string, center: [number, number] = [46.603354, 1.888334]): any {
    if (this.map) {
      this.map.remove();
    }

    // Créer la carte
    this.map = (window as any).L.map(containerId, {
      center,
      zoom: 6,
      zoomControl: true,
      attributionControl: true
    });

    // Ajouter la couche de base OpenStreetMap
    const baseLayer = (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });
    baseLayer.addTo(this.map);

    // Ajouter les couches météo
    this.addWeatherLayers();

    // Événements de la carte
    this.map.on('click', (e: any) => {
      this.onMapClick(e);
    });

    // Mettre à jour le centre
    this.centerSubject.next(center);

    return this.map;
  }

  /**
   * Ajoute les couches météo OpenWeatherMap
   */
  private addWeatherLayers(): void {
    this.weatherLayersConfig.forEach(layerConfig => {
      const layer = (window as any).L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        opacity: 0.7,
        zIndex: 1000
      });

      this.weatherLayers.set(layerConfig.id, {
        layer,
        config: layerConfig
      });
    });
  }

  /**
   * Bascule la visibilité d'une couche météo
   */
  toggleWeatherLayer(layerId: string): boolean {
    const layerInfo = this.weatherLayers.get(layerId);
    if (!layerInfo) return false;

    const { layer, config } = layerInfo;
    
    if (config.visible) {
      this.map.removeLayer(layer);
      config.visible = false;
    } else {
      layer.addTo(this.map);
      config.visible = true;
    }

    return config.visible;
  }

  /**
   * Ajoute un marqueur météo sur la carte
   */
  addWeatherMarker(city: City, weather: CurrentWeather): string {
    if (!this.map) return '';

    const markerId = `${city.name}_${city.country}`;
    
    // Supprimer le marqueur existant s'il y en a un
    this.removeMarker(markerId);

    // Créer l'icône météo personnalisée
    const icon = this.createWeatherIcon(weather);
    
    // Créer le marqueur
    const marker = (window as any).L.marker([city.lat, city.lon], { icon })
      .addTo(this.map);

    // Créer le popup avec les informations météo
    const popup = this.createWeatherPopup(city, weather);
    marker.bindPopup(popup);

    // Stocker le marqueur
    this.markers.set(markerId, marker);

    // Mettre à jour la liste des marqueurs
    this.updateMarkersList();

    return markerId;
  }

  /**
   * Supprime un marqueur
   */
  removeMarker(markerId: string): boolean {
    const marker = this.markers.get(markerId);
    if (marker) {
      this.map.removeLayer(marker);
      this.markers.delete(markerId);
      this.updateMarkersList();
      return true;
    }
    return false;
  }

  /**
   * Supprime tous les marqueurs
   */
  clearAllMarkers(): void {
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers.clear();
    this.updateMarkersList();
  }

  /**
   * Centre la carte sur une ville
   */
  centerOnCity(city: City, zoom: number = 10): void {
    if (!this.map) return;

    const position: [number, number] = [city.lat, city.lon];
    this.map.setView(position, zoom);
    this.centerSubject.next(position);
  }

  /**
   * Centre la carte sur des coordonnées
   */
  centerOnCoordinates(lat: number, lon: number, zoom: number = 10): void {
    if (!this.map) return;

    const position: [number, number] = [lat, lon];
    this.map.setView(position, zoom);
    this.centerSubject.next(position);
  }

  /**
   * Crée une icône personnalisée pour le marqueur météo
   */
  private createWeatherIcon(weather: CurrentWeather): any {
    const weatherCode = weather.weather[0]?.id || 800;
    const temp = Math.round(weather.main.temp);
    
    // Déterminer la couleur selon la température
    let color = '#4CAF50'; // Vert par défaut
    if (temp < 0) color = '#2196F3';      // Bleu (froid)
    else if (temp > 25) color = '#F44336'; // Rouge (chaud)
    else if (temp > 15) color = '#FF9800'; // Orange (tiède)

    // Créer une icône SVG personnalisée
    const iconHtml = `
      <div style="
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${temp}°
      </div>
    `;

    return (window as any).L.divIcon({
      html: iconHtml,
      className: 'weather-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  /**
   * Crée le popup d'information météo
   */
  private createWeatherPopup(city: City, weather: CurrentWeather): string {
    const temp = Math.round(weather.main.temp);
    const feelsLike = Math.round(weather.main.feels_like);
    const humidity = weather.main.humidity;
    const windSpeed = Math.round(weather.wind.speed);
    const description = weather.weather[0]?.description || '';

    return `
      <div class="weather-popup" style="min-width: 200px;">
        <h6 class="mb-2 fw-bold">${city.name}, ${city.country}</h6>
        <div class="d-flex align-items-center mb-2">
          <span class="h4 mb-0 me-2">${temp}°C</span>
          <small class="text-muted">Ressenti: ${feelsLike}°C</small>
        </div>
        <p class="mb-2 text-capitalize">${description}</p>
        <div class="row text-center">
          <div class="col-6">
            <small class="text-muted">Humidité</small><br>
            <strong>${humidity}%</strong>
          </div>
          <div class="col-6">
            <small class="text-muted">Vent</small><br>
            <strong>${windSpeed} km/h</strong>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Met à jour la liste des marqueurs pour les observables
   */
  private updateMarkersList(): void {
    const markersList: MapMarker[] = [];
    
    this.markers.forEach((marker, id) => {
      // Récupérer les données du marqueur (à implémenter selon vos besoins)
      // Pour l'instant, on crée un objet vide
      markersList.push({
        id,
        city: { name: '', lat: 0, lon: 0, country: '' },
        weather: {} as CurrentWeather,
        position: [0, 0]
      });
    });

    this.markersSubject.next(markersList);
  }

  /**
   * Gère le clic sur la carte
   */
  private onMapClick(e: any): void {
    const { lat, lng } = e.latlng;
    console.log(`Clic sur la carte: ${lat}, ${lng}`);
    // Ici vous pouvez ajouter la logique pour afficher les informations
    // de la zone cliquée ou ajouter un marqueur temporaire
  }

  /**
   * Récupère la carte actuelle
   */
  getMap(): any {
    return this.map;
  }

  /**
   * Vérifie si la carte est initialisée
   */
  isMapInitialized(): boolean {
    return this.map !== null;
  }

  /**
   * Nettoie la carte
   */
  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
    this.weatherLayers.clear();
    this.markersSubject.next([]);
  }

  /**
   * Récupère la configuration des couches météo
   */
  getWeatherLayersConfig(): MapLayer[] {
    return [...this.weatherLayersConfig];
  }

  /**
   * Récupère le statut des couches météo
   */
  getWeatherLayersStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.weatherLayersConfig.forEach(layer => {
      status[layer.id] = layer.visible;
    });
    return status;
  }
}

