import { Injectable } from '@angular/core';
import { Position } from '../../shared/models/position';

@Injectable({
  providedIn: 'root'
})
export class ParkingDetectionService {

  constructor() { }
  findTourParkings(tour: Position[]) {
    let parkings: { position: Position; duration: number }[] = [];
    let parkingStartTime: number | null = null;

    for (let i = 0; i < tour.length - 1; i++) {
      if (tour[i].speed === 0 || tour[i].attributes.motion === false) {
        if (parkingStartTime === null) {
          parkingStartTime = new Date(tour[i].deviceTime!).getTime();
        }
      } else if (parkingStartTime !== null) {
        const parkingEndTime = new Date(tour[i].deviceTime!).getTime();
        const parkingDuration = parkingEndTime - parkingStartTime;
        parkings.push({ position: tour[i - 1], duration: parkingDuration });
        parkingStartTime = null;
      }
    }

    return parkings
      .filter(i => i.duration / (1000 * 60) > 4)
      .map(parking => ({
        id: parking.position.id,
        longitude: parking.position.longitude,
        latitude: parking.position.latitude,
        deviceTime: new Date(parking.position.deviceTime!).toLocaleString(),
        speed: parking.position.speed,
        durationInMinutes: parking.duration / (1000 * 60),
        type: 'parking'
      }));
  }
}
