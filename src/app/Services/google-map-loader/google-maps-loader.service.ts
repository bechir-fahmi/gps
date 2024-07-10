import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private apiKey: string = environment.googleMapsApiKey;
  private isLoaded = false;

  constructor() { }
  /**
   * Loads the Google Maps API asynchronously.
   *
   * @return {Promise<void>} A Promise that resolves when the Google Maps API is loaded successfully.
   */
  load(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoaded) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=marker&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = (error: any) => {
        reject(error);
      };

      document.head.appendChild(script);
    });
  }
}
