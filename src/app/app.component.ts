import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <!-- Navigation principale -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container">
        <!-- Logo -->
        <a class="navbar-brand" routerLink="/">
          <i class="bi bi-cloud-sun text-warning"></i>
          Météo App
        </a>

        <!-- Toggler pour mobile -->
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Menu -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav mx-auto">
            <li class="nav-item">
              <a
                class="nav-link text-black ms-5"
                routerLink="/"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <i class="bi bi-house"></i> Accueil
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link text-black ms-5"
                routerLink="/forecast-24h"
                routerLinkActive="active"
              >
                <i class="bi bi-clock"></i> Prévisions 24h
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link text-black ms-5"
                routerLink="/forecast-7days"
                routerLinkActive="active"
              >
                <i class="bi bi-calendar-week"></i> Prévisions 7 jours
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link text-black ms-5"
                routerLink="/map"
                routerLinkActive="active"
              >
                <i class="bi bi-geo-alt"></i> Carte
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link text-black ms-5"
                routerLink="/favorites"
                routerLinkActive="active"
              >
                <i class="bi bi-heart"></i> Favoris
              </a>
            </li>
          </ul>

          <!-- Détails à droite -->
          <div class="navbar-nav">
            <a class="nav-link" routerLink="/details" routerLinkActive="active">
              <i class="bi bi-info-circle"></i> Détails
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
            <p class="mb-0">
              Application météo interactive avec prévisions et carte
            </p>
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
  styles: [
    `
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
        color: #14263d !important;
        transform: translateY(-1px);
      }

      .nav-link.active {
        color: #14263d !important;
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
    `,
  ],
})
export class AppComponent {
  title = 'weather-app';
}
