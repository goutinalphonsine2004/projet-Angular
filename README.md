# 🌤️ Weather App - Application Météo Interactive

Une application météo moderne et interactive construite avec Angular, offrant des prévisions en temps réel, une carte interactive Leaflet, et une gestion des favoris.

## ✨ Fonctionnalités

### 🌍 Météo en Temps Réel
- Affichage de la météo actuelle pour n'importe quelle ville
- Recherche de villes avec autocomplétion
- Géolocalisation automatique
- Données météo complètes (température, humidité, vent, pression, etc.)

### 📊 Prévisions Détaillées
- **Prévisions 24h** : Graphiques horaires avec température, ressenti et humidité
- **Prévisions 7 jours** : Vue d'ensemble hebdomadaire avec graphiques
- Visualisation des données avec ng2-charts
- Statistiques et résumés météorologiques

### 🗺️ Carte Interactive Leaflet
- Carte OpenStreetMap avec zoom et navigation
- Marqueurs météo interactifs avec popups
- Couches météo OpenWeatherMap (température, précipitations, vent, pression, nuages)
- Recherche de villes directement sur la carte
- Géolocalisation et centrage automatique

### ❤️ Gestion des Favoris
- Sauvegarde des villes favorites
- Historique des recherches
- Tri et filtrage des favoris
- Accès rapide aux informations météo

### 📱 Interface Moderne
- Design responsive avec Bootstrap 5
- Navigation intuitive entre les pages
- Mode sombre automatique
- Animations et transitions fluides
- Support mobile et tablette

## 🚀 Technologies Utilisées

- **Frontend** : Angular 17 (Standalone Components)
- **UI Framework** : Bootstrap 5
- **Cartes** : Leaflet + OpenStreetMap
- **Graphiques** : ng2-charts (Chart.js)
- **API Météo** : OpenWeatherMap
- **Styling** : SCSS avec variables et mixins
- **Routing** : Angular Router avec lazy loading

## 📁 Structure du Projet

```
weather-app/
├── src/
│   ├── app/
│   │   ├── components/          # Composants réutilisables
│   │   │   ├── search-bar/      # Barre de recherche
│   │   │   ├── weather-card/    # Carte météo
│   │   │   ├── forecast-chart/  # Graphiques
│   │   │   ├── loading-spinner/ # Indicateur de chargement
│   │   │   └── error-alert/     # Alertes d'erreur
│   │   ├── pages/               # Pages de l'application
│   │   │   ├── home/            # Page d'accueil
│   │   │   ├── forecast24h/     # Prévisions 24h
│   │   │   ├── forecast7days/   # Prévisions 7 jours
│   │   │   ├── details/         # Détails météo
│   │   │   ├── map/             # Carte interactive
│   │   │   ├── favorites/       # Favoris et historique
│   │   │   └── error/           # Gestion des erreurs
│   │   ├── services/            # Services Angular
│   │   │   ├── weather.service.ts    # API météo
│   │   │   ├── map.service.ts        # Gestion carte
│   │   │   └── storage.service.ts    # Stockage local
│   │   ├── models/              # Interfaces TypeScript
│   │   │   └── weather.model.ts # Modèles de données
│   │   ├── app.component.ts     # Composant principal
│   │   ├── app.routes.ts        # Configuration des routes
│   │   └── app.config.ts        # Configuration Angular
│   ├── assets/                  # Ressources statiques
│   └── main.ts                  # Point d'entrée
├── package.json                 # Dépendances
└── README.md                    # Documentation
```

## 🛠️ Installation et Configuration

### Prérequis
- Node.js 18+ et npm
- Angular CLI 17+

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd weather-app

# Installer les dépendances
npm install

# Configuration de l'API
# Remplacer YOUR_API_KEY dans les services par votre clé OpenWeatherMap
```

### Configuration API
1. Obtenez une clé gratuite sur [OpenWeatherMap](https://openweathermap.org/api)
2. Remplacez `YOUR_API_KEY` dans les fichiers suivants :
   - `src/app/services/weather.service.ts`
   - `src/app/services/map.service.ts`

### Lancement
```bash
# Serveur de développement
npm start

# Build de production
npm run build

# Tests
npm test
```

## 🌐 API Utilisées

### OpenWeatherMap
- **Current Weather** : `/data/2.5/weather` - Météo actuelle
- **5-Day Forecast** : `/data/2.5/forecast` - Prévisions 24h
- **One Call API** : `/data/3.0/onecall` - Prévisions 7 jours + données complètes
- **Geocoding** : `/geo/1.0/direct` - Recherche de villes
- **Weather Maps** : Tuiles météo pour Leaflet

## 📱 Pages de l'Application

### 🏠 Accueil
- Recherche de villes
- Météo actuelle avec carte
- Navigation vers les prévisions
- Gestion des favoris

### ⏰ Prévisions 24h
- Graphiques horaires interactifs
- Détails météo par heure
- Statistiques et résumés
- Navigation entre les pages

### 📅 Prévisions 7 jours
- Vue d'ensemble hebdomadaire
- Graphiques température min/max
- Indices UV et précipitations
- Informations solaires

### 📊 Détails Météo
- Informations météo complètes
- Données atmosphériques
- Informations de localisation
- Données techniques

### 🗺️ Carte Interactive
- Carte Leaflet avec zoom
- Marqueurs météo interactifs
- Couches météo spécialisées
- Recherche et géolocalisation

### ❤️ Favoris
- Gestion des villes favorites
- Historique des recherches
- Tri et filtrage
- Accès rapide aux données

### ⚠️ Gestion des Erreurs
- Pages d'erreur personnalisées
- Messages d'aide contextuels
- Suggestions de résolution
- Navigation de récupération

## 🎨 Design et UX

### Responsive Design
- Mobile-first approach
- Breakpoints Bootstrap 5
- Navigation adaptative
- Composants flexibles

### Thème et Couleurs
- Palette de couleurs météo
- Support du mode sombre
- Transitions et animations
- Icônes Bootstrap Icons

### Accessibilité
- Navigation au clavier
- Contraste des couleurs
- Textes alternatifs
- Structure sémantique

## 🔧 Développement

### Architecture
- Composants standalone Angular 17
- Services injectables
- Modèles TypeScript typés
- Routing avec lazy loading

### Gestion d'État
- Services réactifs avec RxJS
- Observables pour les données
- Gestion des erreurs centralisée
- Stockage local avec localStorage

### Performance
- Lazy loading des composants
- Optimisation des images
- Gestion de la mémoire
- Debouncing des recherches

## 🚀 Déploiement

### Build de Production
```bash
npm run build
```

### Variables d'Environnement
- `API_KEY` : Clé OpenWeatherMap
- `API_BASE_URL` : URL de base de l'API

### Plateformes Supportées
- Web (tous navigateurs modernes)
- PWA (Progressive Web App)
- Mobile responsive

## 🤝 Contribution

### Guidelines
- Code TypeScript strict
- Tests unitaires
- Documentation des composants
- Standards de nommage

### Structure des Commits
- `feat:` Nouvelles fonctionnalités
- `fix:` Corrections de bugs
- `docs:` Documentation
- `style:` Formatage du code
- `refactor:` Refactorisation

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [OpenWeatherMap](https://openweathermap.org/) pour l'API météo
- [Leaflet](https://leafletjs.com/) pour les cartes interactives
- [Bootstrap](https://getbootstrap.com/) pour l'interface utilisateur
- [Angular](https://angular.io/) pour le framework

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Contacter l'équipe de développement

---

**Weather App** - Une application météo moderne et interactive pour tous vos besoins météorologiques ! 🌤️
# projet-Angular
