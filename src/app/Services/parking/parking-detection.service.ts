import { Injectable } from '@angular/core';
import { Position } from '../../shared/models/position';

@Injectable({
  providedIn: 'root'
})
export class ParkingDetectionService {

  constructor() { }
  /**
 * Find parkings in the given tour based on specific conditions and calculate their details.
 *
 * @param {Position[]} tour - The tour positions to analyze for parkings.
 * @return {Object[]} An array of parking objects with detailed information.
 */
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



  Travel(tour: Position[]) {
    let parkings: { position: Position; duration: number }[] = [];
    let parkingStartTime: number | null = null;

    for (let i = 0; i < tour.length - 1; i++) {
      if (tour[i].speed != 0 || tour[i].attributes.motion === true) {
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
        type: 'traveling'
      }));
  }

  /**
 * Calculate the distance in kilometers between two geographical points using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @return {number} Distance between the two points in kilometers.
 */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
