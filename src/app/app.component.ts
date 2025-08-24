import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet
  ],
  template: `
    <!-- Navigation principale -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" routerLink="/">
          <i class="bi bi-cloud-sun"></i>
          Météo App
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <i class="bi bi-house"></i>
                Accueil
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/forecast-24h" routerLinkActive="active">
                <i class="bi bi-clock"></i>
                Prévisions 24h
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/forecast-7days" routerLinkActive="active">
                <i class="bi bi-calendar-week"></i>
                Prévisions 7 jours
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/map" routerLinkActive="active">
                <i class="bi bi-geo-alt"></i>
                Carte
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/favorites" routerLinkActive="active">
                <i class="bi bi-heart"></i>
                Favoris
              </a>
            </li>
          </ul>
          
          <div class="navbar-nav">
            <a class="nav-link" routerLink="/details" routerLinkActive="active">
              <i class="bi bi-info-circle"></i>
              Détails
            </a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Contenu principal -->
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <!-- Footer -->
    <footer class="footer bg-dark text-light py-4 mt-5">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <h5>Météo App</h5>
            <p class="mb-0">Application météo interactive avec prévisions et carte</p>
          </div>
          <div class="col-md-6 text-md-end">
            <p class="mb-0">
              <i class="bi bi-cloud"></i>
              Données météo fournies par OpenWeatherMap
            </p>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .navbar-brand {
      font-weight: 700;
      font-size: 1.5rem;
    }
    
    .navbar-brand i {
      margin-right: 0.5rem;
      color: #ffc107;
    }
    
    .nav-link {
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover {
      color: #ffc107 !important;
      transform: translateY(-1px);
    }
    
    .nav-link.active {
      color: #ffc107 !important;
      font-weight: 600;
    }
    
    .nav-link i {
      margin-right: 0.25rem;
    }
    
    .main-content {
      min-height: calc(100vh - 200px);
    }
    
    .footer {
      margin-top: auto;
    }
    
    .footer h5 {
      color: #ffc107;
      font-weight: 600;
    }
    
    .footer i {
      color: #ffc107;
      margin-right: 0.5rem;
    }
    
    @media (max-width: 768px) {
      .navbar-nav {
        text-align: center;
        margin-top: 1rem;
      }
      
      .navbar-nav .nav-item {
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class AppComponent {
  title = 'weather-app';
}
