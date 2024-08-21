export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  readonly: boolean;
  administrator: boolean;
  map: string | null; // Allow null
  latitude: number;
  longitude: number;
  zoom: number;
  password: string | null; // Allow null
  // twelveHourFormat: boolean;
  coordinateFormat: string | null; // Allow null
  disabled: boolean;
  expirationTime: string | null; // Allow null
  deviceLimit: number;
  userLimit: number;
  deviceReadonly: boolean;
  limitCommands: boolean;
  fixedEmail: boolean;
  poiLayer: string | null; // Allow null
  attributes: Record<string, any>;
}
