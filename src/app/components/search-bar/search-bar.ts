import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { WeatherService } from '../../services/weather.service';
import { StorageService, SearchHistory } from '../../services/storage.service';
import { City } from '../../models/weather.model';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.scss']   
})

export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Rechercher une ville...';
  @Input() size: 'sm' | 'md' | 'lg' = 'lg';
  @Input() disabled: boolean = false;
  
  @Output() citySelected = new EventEmitter<City>();
  @Output() searchSubmitted = new EventEmitter<string>();
  @Output() searchChanged = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchQuery: string = '';
  suggestions: City[] = [];
  searchHistory: SearchHistory[] = [];
  showSuggestions: boolean = false;
  isLoading: boolean = false;
  isSearching: boolean = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    // Configuration de la recherche avec debounce
    this.searchSubject.pipe(
      debounceTime(300), // Attendre 300ms après la dernière frappe
      distinctUntilChanged(), // Éviter les recherches identiques
      switchMap(query => {
        if (query.length < 2) {
          this.suggestions = [];
          this.isSearching = false;
          return of([]);
        }
        
        this.isSearching = true;
        return this.weatherService.searchCities(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (cities) => {
        this.suggestions = cities;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.suggestions = [];
        this.isSearching = false;
      }
    });

    // S'abonner à l'historique des recherches
    this.storageService.history$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(history => {
      this.searchHistory = history;
    });

    // Cacher les suggestions lors du clic à l'extérieur
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  /**
   * Gère la saisie dans le champ de recherche
   */
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.trim();
    
    this.searchQuery = query;
    this.searchChanged.emit(query);
    
    // Déclencher la recherche avec debounce
    this.searchSubject.next(query);
    
    // Afficher les suggestions si la recherche n'est pas vide
    this.showSuggestions = true;
  }

  /**
   * Gère la soumission de la recherche (Entrée ou clic sur bouton)
   */
  onSearchSubmit(): void {
    if (this.searchQuery.trim().length === 0) return;
    
    this.isLoading = true;
    this.showSuggestions = false;
    
    // Émettre l'événement de soumission
    this.searchSubmitted.emit(this.searchQuery.trim());
    
    // Ajouter à l'historique
    this.storageService.addToHistory(this.searchQuery.trim());
    
    // Simuler un délai de chargement
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Sélectionne une ville depuis les suggestions
   */
  selectCity(city: City): void {
    this.searchQuery = city.name;
    this.showSuggestions = false;
    this.suggestions = [];
    
    // Ajouter à l'historique avec coordonnées
    this.storageService.addToHistory(city.name, { lat: city.lat, lon: city.lon });
    
    // Émettre l'événement de sélection
    this.citySelected.emit(city);
    
    // Blur l'input
    this.searchInput?.nativeElement.blur();
  }

  /**
   * Sélectionne une ville depuis l'historique
   */
  selectFromHistory(historyItem: SearchHistory): void {
    this.searchQuery = historyItem.city;
    this.showSuggestions = false;
    
    // Si on a les coordonnées, créer un objet City
    if (historyItem.coordinates) {
      const city: City = {
        name: historyItem.city,
        lat: historyItem.coordinates.lat,
        lon: historyItem.coordinates.lon,
        country: '' // On n'a pas le pays dans l'historique
      };
      this.citySelected.emit(city);
    } else {
      // Sinon, faire une recherche normale
      this.searchSubmitted.emit(historyItem.city);
    }
    
    // Blur l'input
    this.searchInput?.nativeElement.blur();
  }

  /**
   * Efface la recherche
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.searchChanged.emit('');
  }

  /**
   * Focus sur le champ de recherche
   */
  focus(): void {
    this.searchInput?.nativeElement.focus();
  }

  /**
   * Gère le clic à l'extérieur pour cacher les suggestions
   */
  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.search-bar-container');
    
    if (!searchContainer) {
      this.showSuggestions = false;
    }
  }

  /**
   * TrackBy functions pour optimiser les performances
   */
  trackByCity(index: number, city: City): string {
    return `${city.name}_${city.lat}_${city.lon}`;
  }

  trackByHistory(index: number, item: SearchHistory): string {
    return `${item.city}_${item.timestamp}`;
  }

  /**
   * Formatte le temps écoulé depuis une recherche
   */
  getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  }
}
