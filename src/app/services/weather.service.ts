import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CurrentWeather, ForecastResponse, City, OneCallResponse } from '../models/weather.model';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly apiKey = environment.openWeatherMapApiKey;
  private readonly baseUrl = environment.openWeatherMapBaseUrl;
  private readonly geoUrl = environment.openWeatherMapGeoUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la météo actuelle d'une ville
   */
  getCurrentWeather(city: string): Observable<CurrentWeather> {
    const params = new HttpParams()
      .set('q', city)
      .set('appid', this.apiKey)
      .set('units', 'metric')
      .set('lang', 'fr');

    return this.http.get<CurrentWeather>(`${this.baseUrl}/weather`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les prévisions 24h (5 prévisions à 3h d'intervalle)
   */
  getForecast24h(lat: number, lon: number): Observable<ForecastResponse> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('appid', this.apiKey)
      .set('units', 'metric')
      .set('lang', 'fr')
      .set('cnt', '8'); // 8 prévisions = 24h

    return this.http.get<ForecastResponse>(`${this.baseUrl}/forecast`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les prévisions 7 jours (utilise l'API 5-day forecast gratuite)
   */
  getForecast7days(lat: number, lon: number): Observable<ForecastResponse> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('appid', this.apiKey)
      .set('units', 'metric')
      .set('lang', 'fr');
      // Pas de cnt pour récupérer toutes les prévisions 5 jours (40 points)

    return this.http.get<ForecastResponse>(`${this.baseUrl}/forecast`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les coordonnées d'une ville
   */
  getCoordinates(city: string): Observable<City[]> {
    const params = new HttpParams()
      .set('q', city)
      .set('limit', '5')
      .set('appid', this.apiKey);

    return this.http.get<City[]>(`${this.geoUrl}/direct`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère la météo par coordonnées
   */
  getWeatherByCoordinates(lat: number, lon: number): Observable<CurrentWeather> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('appid', this.apiKey)
      .set('units', 'metric')
      .set('lang', 'fr');

    return this.http.get<CurrentWeather>(`${this.baseUrl}/weather`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Recherche de villes avec autocomplétion
   */
  searchCities(query: string): Observable<City[]> {
    if (query.length < 2) {
      return new Observable(observer => observer.next([]));
    }

    return this.getCoordinates(query).pipe(
      map(cities => cities.slice(0, 5)) // Limite à 5 résultats
    );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.status === 401) {
      errorMessage = 'Clé API invalide. Vérifiez votre configuration.';
    } else if (error.status === 404) {
      errorMessage = 'Ville non trouvée. Vérifiez l\'orthographe.';
    } else if (error.status === 429) {
      errorMessage = 'Limite de requêtes API atteinte. Réessayez plus tard.';
    } else if (error.status === 0) {
      errorMessage = 'Pas de connexion internet. Vérifiez votre connexion.';
    }

    console.error('Erreur API:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Formate la température avec unité
   */
  formatTemperature(temp: number): string {
    return `${Math.round(temp)}°C`;
  }

  /**
   * Formate la vitesse du vent
   */
  formatWindSpeed(speed: number): string {
    return `${Math.round(speed)} km/h`;
  }

  /**
   * Formate l'humidité
   */
  formatHumidity(humidity: number): string {
    return `${humidity}%`;
  }

  /**
   * Formate la pression
   */
  formatPressure(pressure: number): string {
    return `${pressure} hPa`;
  }
}

