# 📚 Documentation des Services - WeatherApp

## 🌟 Vue d'ensemble

Cette documentation décrit tous les services créés pour l'application météo Angular. Chaque service a une responsabilité spécifique et utilise les meilleures pratiques Angular.

## 🔧 Services Principaux

### 1. WeatherService
**Responsabilité** : Gestion de l'API OpenWeatherMap et récupération des données météo.

#### Méthodes principales :
- `getCurrentWeather(city: string)` - Météo actuelle d'une ville
- `getForecast24h(lat: number, lon: number)` - Prévisions 24h
- `getForecast7days(lat: number, lon: number)` - Prévisions 7 jours
- `getCoordinates(city: string)` - Coordonnées géographiques
- `searchCities(query: string)` - Recherche avec autocomplétion

#### Gestion des erreurs :
- Gestion automatique des codes d'erreur HTTP
- Messages d'erreur localisés en français
- Retry automatique pour les erreurs temporaires

#### Configuration :
```typescript
// Dans environment.ts
openWeatherMapApiKey: 'YOUR_API_KEY'
openWeatherMapBaseUrl: 'https://api.openweathermap.org/data/2.5'
openWeatherMapGeoUrl: 'https://api.openweathermap.org/geo/1.0'
```

---

### 2. StorageService
**Responsabilité** : Gestion du stockage local (favoris et historique).

#### Fonctionnalités :
- **Favoris** : Sauvegarde des villes préférées (max 10)
- **Historique** : Suivi des recherches récentes (max 20)
- **Persistance** : Données sauvegardées dans localStorage
- **Nettoyage automatique** : Suppression des données expirées

#### Méthodes principales :
- `addToFavorites(city: City, weather?: CurrentWeather)`
- `removeFromFavorites(cityName: string, countryCode: string)`
- `addToHistory(city: string, coordinates?: { lat: number; lon: number })`
- `exportData()` / `importData(jsonData: string)`

#### Observables :
- `favorites$` - Liste des favoris en temps réel
- `history$` - Historique des recherches en temps réel

---

### 3. MapService
**Responsabilité** : Gestion de la carte interactive Leaflet et des couches météo.

#### Fonctionnalités :
- **Carte de base** : OpenStreetMap avec Leaflet
- **Couches météo** : 5 couches OpenWeatherMap gratuites
- **Marqueurs personnalisés** : Icônes météo avec température
- **Popups informatifs** : Détails météo au clic
- **Gestion des événements** : Clics, zoom, centrage

#### Couches météo disponibles :
- 🌤️ **Nuages** - Couverture nuageuse
- 🌧️ **Précipitations** - Pluie et neige
- 📊 **Pression** - Pression atmosphérique
- 💨 **Vent** - Direction et vitesse du vent
- 🌡️ **Température** - Températures en temps réel

#### Méthodes principales :
- `initializeMap(containerId: string, center: [number, number])`
- `addWeatherMarker(city: City, weather: CurrentWeather)`
- `toggleWeatherLayer(layerId: string)`
- `centerOnCity(city: City, zoom: number)`

---

### 4. ErrorService
**Responsabilité** : Gestion centralisée des erreurs de l'application.

#### Types d'erreurs :
- **Error** : Erreurs critiques (affichage global)
- **Warning** : Avertissements (affichage local)
- **Info** : Informations (affichage temporaire)

#### Gestion automatique :
- **Erreurs API** : Codes HTTP et messages contextuels
- **Géolocalisation** : Permissions et timeouts
- **Stockage** : Quota et permissions localStorage
- **Nettoyage** : Suppression automatique des erreurs anciennes

#### Observables :
- `errors$` - Liste de toutes les erreurs
- `globalError$` - Erreur critique actuelle

---

## 🔗 Intégration des Services

### Injection dans les composants :
```typescript
constructor(
  private weatherService: WeatherService,
  private storageService: StorageService,
  private mapService: MapService,
  private errorService: ErrorService
) {}
```

### Utilisation des observables :
```typescript
// S'abonner aux favoris
this.storageService.favorites$.subscribe(favorites => {
  this.favorites = favorites;
});

// Gérer les erreurs
this.errorService.globalError$.subscribe(error => {
  if (error) {
    this.showGlobalError(error);
  }
});
```

---

## 🚀 Bonnes Pratiques Implémentées

### 1. **Gestion des erreurs**
- Catch et gestion RxJS avec `catchError`
- Messages d'erreur localisés
- Retry automatique pour les erreurs temporaires

### 2. **Observables et Reactivité**
- `BehaviorSubject` pour l'état initial
- Observables publics pour la réactivité
- Gestion automatique des souscriptions

### 3. **Stockage sécurisé**
- Try-catch pour localStorage
- Validation des données
- Nettoyage automatique des données expirées

### 4. **Performance**
- Limitation du nombre d'éléments
- Nettoyage automatique des ressources
- Gestion efficace de la mémoire

---

## 📱 Configuration et Déploiement

### Variables d'environnement :
```typescript
// environment.ts
export const environment = {
  production: false,
  openWeatherMapApiKey: 'YOUR_API_KEY',
  openWeatherMapBaseUrl: 'https://api.openweathermap.org/data/2.5',
  openWeatherMapGeoUrl: 'https://api.openweathermap.org/geo/1.0'
};
```

### Dépendances requises :
```json
{
  "bootstrap": "^5.x.x",
  "leaflet": "^1.x.x",
  "@types/leaflet": "^1.x.x",
  "ng2-charts": "^x.x.x",
  "chart.js": "^x.x.x"
}
```

---

## 🔍 Tests et Débogage

### Tests unitaires :
- Configuration TestBed pour chaque service
- Tests d'injection et de création
- Validation des méthodes publiques

### Débogage :
- Logs détaillés des erreurs
- Console pour les opérations importantes
- Gestion des erreurs de développement

---

## 📈 Évolutions Futures

### Fonctionnalités prévues :
- **Cache intelligent** : Mise en cache des données météo
- **Notifications** : Alertes météo en temps réel
- **Offline** : Mode hors ligne avec données en cache
- **Multi-langues** : Support de plusieurs langues
- **Thèmes** : Mode sombre/clair dynamique

### Optimisations :
- **Lazy loading** : Chargement à la demande des services
- **Web Workers** : Traitement en arrière-plan
- **Service Workers** : Cache et synchronisation
- **PWA** : Installation comme application native

---

## 🎯 Conclusion

Tous les services sont maintenant configurés et prêts pour la **Phase 3 : Composants de base**. L'architecture est robuste, maintenable et suit les meilleures pratiques Angular.

**Prochaine étape** : Création des composants réutilisables (SearchBar, WeatherCard, ForecastChart).

