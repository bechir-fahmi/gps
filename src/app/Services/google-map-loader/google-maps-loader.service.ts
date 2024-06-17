import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private apiKey: string = 'AIzaSyDS5UbPHEoKmTSGLtRLBzbSclyaV-lufcI';
  private isLoaded = false;

  constructor() { }

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
