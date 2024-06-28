export interface Position {
  id?: number,
  deviceId: number,
  protocol?: string,
  deviceTime?: Date,
  fixTime?: Date,
  serverTime?: Date,
  outdated?: boolean,
  valid?: boolean,
  latitude: number,
  longitude: number,
  altitude?: number,
  speed?: number,
  course?: number,
  address?: string
  accuracy?: number,
  network?:any,
  geofenceIds?: any[],
  attributes?: any
}
