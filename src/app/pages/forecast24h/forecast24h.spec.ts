import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Forecast24h } from './forecast24h';

describe('Forecast24h', () => {
  let component: Forecast24h;
  let fixture: ComponentFixture<Forecast24h>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forecast24h]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Forecast24h);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
