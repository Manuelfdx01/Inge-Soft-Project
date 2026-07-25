import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CollectionPoint,
  CollectionPointsService
} from './collection-points.service';

@Injectable({
  providedIn: 'root'
})
export class CitizenService {

  constructor(
    private collectionPoints: CollectionPointsService
  ) {}

  /**
   * Obtiene todos los puntos de reciclaje.
   */
  getCollectionPoints(
    wasteType?: string,
    status?: string
  ): Observable<CollectionPoint[]> {

    return this.collectionPoints.getAll(
      wasteType,
      status
    );

  }

  /**
   * Obtiene un punto específico.
   */
  getCollectionPoint(
    id: string
  ): Observable<CollectionPoint> {

    return this.collectionPoints.getById(id);

  }

}
