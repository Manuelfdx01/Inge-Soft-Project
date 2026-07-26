import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google: any;
    initGoogleMapsPromise?: Promise<void>;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private isLoaded = false;

  load(): Promise<void> {
    if (this.isLoaded || (window.google && window.google.maps)) {
      this.isLoaded = true;
      return Promise.resolve();
    }

    if (window.initGoogleMapsPromise) {
      return window.initGoogleMapsPromise;
    }

    const apiKey = environment.googleMapsApiKey || 'YOUR_GOOGLE_MAPS_API_KEY';

    window.initGoogleMapsPromise = new Promise((resolve, reject) => {
      // Si la clave es el placeholder por defecto o vacía, lanzar advertencia limpia
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.warn('Google Maps API Key no configurada o usando placeholder. Usando fallback interactivo.');
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry,marker&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = (err) => {
        console.error('Error al cargar Google Maps API Script:', err);
        reject(err);
      };

      document.head.appendChild(script);
    });

    return window.initGoogleMapsPromise;
  }
}
