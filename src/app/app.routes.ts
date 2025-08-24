import { Routes } from '@angular/router';

export const routes: Routes = [
  // Page d'accueil
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
    title: 'Accueil - Météo App'
  },
  
  // Page prévisions 24h
  {
    path: 'forecast-24h',
    loadComponent: () => import('./pages/forecast24h/forecast24h').then(m => m.Forecast24hComponent),
    title: 'Prévisions 24h - Météo App'
  },
  
  // Page prévisions 7 jours
  {
    path: 'forecast-7days',
    loadComponent: () => import('./pages/forecast7days/forecast7days').then(m => m.Forecast7daysComponent),
    title: 'Prévisions 7 jours - Météo App'
  },
  
  // Page détails météo
  {
    path: 'details',
    loadComponent: () => import('./pages/details/details').then(m => m.DetailsComponent),
    title: 'Détails météo - Météo App'
  },
  
  // Page carte interactive
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map').then(m => m.MapComponent),
    title: 'Carte météo - Météo App'
  },
  
  // Page favoris et historique
  {
    path: 'favorites',
    loadComponent: () => import('./pages/favorites/favorites').then(m => m.FavoritesComponent),
    title: 'Favoris - Météo App'
  },
  
  // Page d'erreur
  {
    path: 'error',
    loadComponent: () => import('./pages/error/error').then(m => m.ErrorComponent),
    title: 'Erreur - Météo App'
  },
  
  // Route wildcard pour les pages non trouvées
  {
    path: '**',
    redirectTo: 'error'
  }
];
