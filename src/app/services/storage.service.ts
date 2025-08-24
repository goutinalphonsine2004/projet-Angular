import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { City, CurrentWeather } from '../models/weather.model';

export interface FavoriteCity {
  city: City;
  lastUpdate: number;
  lastVisited?: number;
  weather?: CurrentWeather;
}

export interface SearchHistory {
  city: string;
  timestamp: number;
  coordinates?: { lat: number; lon: number };
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly FAVORITES_KEY = 'weather_app_favorites';
  private readonly HISTORY_KEY = 'weather_app_history';
  private readonly MAX_HISTORY_ITEMS = 20;
  private readonly MAX_FAVORITES = 10;

  private favoritesSubject = new BehaviorSubject<FavoriteCity[]>([]);
  private historySubject = new BehaviorSubject<SearchHistory[]>([]);

  public favorites$ = this.favoritesSubject.asObservable();
  public history$ = this.historySubject.asObservable();

  constructor() {
    this.loadFavorites();
    this.loadHistory();
  }

  // ===== GESTION DES FAVORIS =====

  /**
   * Ajoute une ville aux favoris
   */
  addToFavorites(city: City, weather?: CurrentWeather): boolean {
    const favorites = this.getFavorites();
    
    // Vérifier si la ville est déjà dans les favoris
    if (favorites.some(fav => fav.city.name === city.name && fav.city.country === city.country)) {
      return false;
    }

    // Vérifier la limite de favoris
    if (favorites.length >= this.MAX_FAVORITES) {
      return false;
    }

    const favoriteCity: FavoriteCity = {
      city,
      lastUpdate: Date.now(),
      weather
    };

    favorites.push(favoriteCity);
    this.saveFavorites(favorites);
    this.favoritesSubject.next(favorites);
    
    return true;
  }

  /**
   * Supprime une ville des favoris
   */
  removeFromFavorites(cityName: string, countryCode: string): boolean {
    const favorites = this.getFavorites();
    const initialLength = favorites.length;
    
    const filteredFavorites = favorites.filter(
      fav => !(fav.city.name === cityName && fav.city.country === countryCode)
    );

    if (filteredFavorites.length !== initialLength) {
      this.saveFavorites(filteredFavorites);
      this.favoritesSubject.next(filteredFavorites);
      return true;
    }
    
    return false;
  }

  /**
   * Supprime une ville des favoris (alias pour compatibilité)
   */
  removeFavorite(favorite: FavoriteCity): boolean {
    return this.removeFromFavorites(favorite.city.name, favorite.city.country);
  }

  /**
   * Supprime un élément de l'historique
   */
  removeFromHistory(cityName: string): boolean {
    const history = this.getHistory();
    const initialLength = history.length;
    
    const filteredHistory = history.filter(item => item.city !== cityName);

    if (filteredHistory.length !== initialLength) {
      this.saveHistory(filteredHistory);
      this.historySubject.next(filteredHistory);
      return true;
    }
    
    return false;
  }

  /**
   * Efface tous les favoris
   */
  clearFavorites(): void {
    localStorage.removeItem(this.FAVORITES_KEY);
    this.favoritesSubject.next([]);
  }

  /**
   * Met à jour la météo d'un favori
   */
  updateFavoriteWeather(cityName: string, countryCode: string, weather: CurrentWeather): void {
    const favorites = this.getFavorites();
    
    const updatedFavorites = favorites.map(fav => {
      if (fav.city.name === cityName && fav.city.country === countryCode) {
        return { ...fav, weather, lastUpdate: Date.now() };
      }
      return fav;
    });

    this.saveFavorites(updatedFavorites);
    this.favoritesSubject.next(updatedFavorites);
  }

  /**
   * Vérifie si une ville est dans les favoris
   */
  isFavorite(cityName: string, countryCode: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.city.name === cityName && fav.city.country === countryCode);
  }

  /**
   * Récupère tous les favoris
   */
  getFavorites(): FavoriteCity[] {
    try {
      const stored = localStorage.getItem(this.FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des favoris:', error);
      return [];
    }
  }

  /**
   * Sauvegarde les favoris
   */
  private saveFavorites(favorites: FavoriteCity[]): void {
    try {
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  }

  /**
   * Charge les favoris depuis localStorage
   */
  private loadFavorites(): void {
    const favorites = this.getFavorites();
    this.favoritesSubject.next(favorites);
  }

  // ===== GESTION DE L'HISTORIQUE =====

  /**
   * Ajoute une recherche à l'historique
   */
  addToHistory(city: string, coordinates?: { lat: number; lon: number }): void {
    const history = this.getHistory();
    
    // Supprimer les doublons récents
    const filteredHistory = history.filter(
      item => !(item.city.toLowerCase() === city.toLowerCase() && 
                Date.now() - item.timestamp < 60000) // 1 minute
    );

    const newEntry: SearchHistory = {
      city,
      timestamp: Date.now(),
      coordinates
    };

    filteredHistory.unshift(newEntry);

    // Limiter le nombre d'éléments
    if (filteredHistory.length > this.MAX_HISTORY_ITEMS) {
      filteredHistory.splice(this.MAX_HISTORY_ITEMS);
    }

    this.saveHistory(filteredHistory);
    this.historySubject.next(filteredHistory);
  }

  /**
   * Récupère l'historique des recherches
   */
  getHistory(): SearchHistory[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture de l\'historique:', error);
      return [];
    }
  }

  /**
   * Efface l'historique
   */
  clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
    this.historySubject.next([]);
  }

  /**
   * Sauvegarde l'historique
   */
  private saveHistory(history: SearchHistory[]): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
  }

  /**
   * Charge l'historique depuis localStorage
   */
  private loadHistory(): void {
    const history = this.getHistory();
    this.historySubject.next(history);
  }

  // ===== UTILITAIRES =====

  /**
   * Nettoie les données expirées (plus de 7 jours)
   */
  cleanupExpiredData(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Nettoyer l'historique
    const history = this.getHistory().filter(item => item.timestamp > sevenDaysAgo);
    this.saveHistory(history);
    this.historySubject.next(history);
    
    // Nettoyer les favoris (garder seulement les données récentes)
    const favorites = this.getFavorites().map(fav => ({
      ...fav,
      weather: fav.lastUpdate > sevenDaysAgo ? fav.weather : undefined
    }));
    this.saveFavorites(favorites);
    this.favoritesSubject.next(favorites);
  }

  /**
   * Exporte les données (pour sauvegarde)
   */
  exportData(): string {
    const data = {
      favorites: this.getFavorites(),
      history: this.getHistory(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importe des données (pour restauration)
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.favorites && Array.isArray(data.favorites)) {
        this.saveFavorites(data.favorites);
        this.favoritesSubject.next(data.favorites);
      }
      
      if (data.history && Array.isArray(data.history)) {
        this.saveHistory(data.history);
        this.historySubject.next(data.history);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      return false;
    }
  }
}

