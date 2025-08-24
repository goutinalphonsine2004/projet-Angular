import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h3>Test Component</h3>
            </div>
            <div class="card-body">
              <p>Ce composant de test fonctionne !</p>
              <p>L'application peut se lancer correctement.</p>
              <div class="alert alert-success">
                <i class="bi bi-check-circle"></i>
                Configuration de base OK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    
    .alert {
      margin-top: 1rem;
    }
  `]
})
export class TestComponent {
  constructor() {
    console.log('TestComponent initialized');
  }
}
