export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  readonly: boolean;
  administrator: boolean;
  map: string;
  latitude: number;
  longitude: number;
  zoom: number;
  password: string;
  twelveHourFormat: boolean;
  coordinateFormat: string;
  disabled: boolean;
  expirationTime: string; // in ISO 8601 format
  deviceLimit: number;
  userLimit: number;
  deviceReadonly: boolean;
  limitCommands: boolean;
  fixedEmail: boolean;
  poiLayer: string;
  attributes: Record<string, any>;
}
