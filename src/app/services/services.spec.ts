import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';
import { StorageService } from './storage.service';
import { MapService } from './map.service';
import { ErrorService } from './error.service';

describe('Services Configuration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        WeatherService,
        StorageService,
        MapService,
        ErrorService
      ]
    });
  });

  it('should create WeatherService', () => {
    const service = TestBed.inject(WeatherService);
    expect(service).toBeTruthy();
  });

  it('should create StorageService', () => {
    const service = TestBed.inject(StorageService);
    expect(service).toBeTruthy();
  });

  it('should create MapService', () => {
    const service = TestBed.inject(MapService);
    expect(service).toBeTruthy();
  });

  it('should create ErrorService', () => {
    const service = TestBed.inject(ErrorService);
    expect(service).toBeTruthy();
  });
});

