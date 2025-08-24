import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForecastItem, ForecastResponse } from '../../models/weather.model';

// Chart.js types
declare var Chart: any;

@Component({
  selector: 'app-forecast-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forecast-chart.html',
  styleUrl: './forecast-chart.scss'
})
export class ForecastChartComponent implements OnInit, OnChanges {
  @Input() forecastData: ForecastResponse | null = null;
  @Input() title: string = 'Prévisions météo';
  @Input() chartType: 'line' | 'bar' = 'line';
  @Input() showControls: boolean = true;
  @Input() showLegend: boolean = true;
  @Input() showSummary: boolean = true;
  @Input() showActions: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() height: number = 400;
  @Input() period: '24h' | '7days' = '24h';
  
  @Output() chartClick = new EventEmitter<any>();
  @Output() chartHover = new EventEmitter<any>();
  @Output() exportClick = new EventEmitter<void>();
  @Output() fullscreenClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() chartTypeChange = new EventEmitter<'line' | 'bar'>();
  
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef;

  chart: any = null;
  chartData: any = null;
  chartOptions: any = {};
  
  // Statistiques calculées
  maxTemp: number = 0;
  minTemp: number = 0;
  avgTemp: number = 0;
  rainProbability: number | null = null;

  constructor() {}

  ngOnInit(): void {
    this.setupChartOptions();
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forecastData'] && !changes['forecastData'].firstChange) {
      this.processData();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  /**
   * Configure les options du graphique
   */
  private setupChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: this.showLegend,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: 'Segoe UI, sans-serif',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          display: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            callback: (value: any) => `${value}°C`
          }
        }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 3
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          borderWidth: 2
        }
      }
    };
  }

  /**
   * Traite les données de prévision pour le graphique
   */
  private processData(): void {
    if (!this.forecastData?.list || this.forecastData.list.length === 0) {
      this.chartData = null;
      return;
    }

    const items = this.period === '24h' 
      ? this.forecastData.list.slice(0, 8) // 24h = 8 points (3h d'intervalle)
      : this.forecastData.list.slice(0, 7); // 7 jours maximum

    const labels = items.map(item => {
      const date = new Date(item.dt * 1000);
      return this.period === '24h' 
        ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    });

    const temperatures = items.map(item => Math.round(item.main.temp));
    const tempMin = items.map(item => Math.round(item.main.temp_min));
    const tempMax = items.map(item => Math.round(item.main.temp_max));
    const humidity = items.map(item => item.main.humidity);
    const precipitation = items.map(item => Math.round((item.pop || 0) * 100));

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Température',
          data: temperatures,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Temp. Min',
          data: tempMin,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'Temp. Max',
          data: tempMax,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'Humidité (%)',
          data: humidity,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          yAxisID: 'y1',
          hidden: true
        },
        {
          label: 'Probabilité de pluie (%)',
          data: precipitation,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          yAxisID: 'y1',
          hidden: this.chartType === 'line'
        }
      ]
    };

    // Ajouter l'axe Y secondaire pour humidité et précipitations
    if (this.chartOptions?.scales) {
      this.chartOptions.scales['y1'] = {
        type: 'linear',
        display: false,
        position: 'right',
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          callback: (value: any) => `${value}%`
        }
      };
    }

    // Calculer les statistiques
    this.calculateStatistics(items);

    // Créer ou mettre à jour le graphique
    this.createOrUpdateChart();
  }

  /**
   * Crée ou met à jour le graphique Chart.js
   */
  private createOrUpdateChart(): void {
    if (!this.chartCanvas?.nativeElement) return;

    // Détruire l'ancien graphique s'il existe
    if (this.chart) {
      this.chart.destroy();
    }

    // Créer le nouveau graphique
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: this.chartType,
      data: this.chartData,
      options: this.chartOptions
    });
  }

  /**
   * Calcule les statistiques pour le résumé
   */
  private calculateStatistics(items: any[]): void {
    if (items.length === 0) return;
    
    const temps = items.map(item => item.main.temp);
    
    this.maxTemp = Math.round(Math.max(...temps));
    this.minTemp = Math.round(Math.min(...temps));
    this.avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
    
    const precipitation = items.map(item => (item.pop || 0) * 100);
    
    this.rainProbability = Math.round(
      precipitation.reduce((a, b) => a + b, 0) / precipitation.length
    );
  }

  /**
   * Gestionnaires d'événements
   */
  onChartTypeChange(type: 'line' | 'bar'): void {
    this.chartType = type;
    this.chartTypeChange.emit(type);
    this.processData();
  }

  onChartClick(event: any): void {
    this.chartClick.emit(event);
  }

  onChartHover(event: any): void {
    this.chartHover.emit(event);
  }

  onExportClick(): void {
    this.exportClick.emit();
  }

  onFullscreenClick(): void {
    this.fullscreenClick.emit();
  }

  onRefreshClick(): void {
    this.refreshClick.emit();
  }
}
