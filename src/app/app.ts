import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  title = 'WeatherApp';
  isMenuOpen = false;
  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 992;
    
    // Sur desktop, le menu est toujours ouvert
    if (!this.isMobile) {
      this.isMenuOpen = true;
    }
  }

  toggleMenu(): void {
    // Seulement sur mobile
    if (this.isMobile) {
      this.isMenuOpen = !this.isMenuOpen;
    }
  }

  closeMenu(): void {
    // Seulement sur mobile
    if (this.isMobile) {
      this.isMenuOpen = false;
    }
  }
}
